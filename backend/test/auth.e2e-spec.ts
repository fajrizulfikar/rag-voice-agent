import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

describe('Authentication System (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up test users
    await userRepository.delete({});
    await app.close();
  });

  async function createTestUsers() {
    const hashedPassword = await bcrypt.hash('testpassword', 12);

    // Create regular user
    const user = userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      isActive: true,
    });
    await userRepository.save(user);

    // Create admin user
    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);
  }

  describe('Public Endpoints', () => {
    it('/auth/register (POST) - should register new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'newpassword',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.username).toBe('newuser');
          expect(res.body.user.email).toBe('newuser@example.com');
          expect(res.body.user.role).toBe(UserRole.USER);
        });
    });

    it('/auth/login (POST) - should login existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      jwtToken = response.body.access_token;
    });

    it('/auth/login (POST) - should login admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'testpassword',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe(UserRole.ADMIN);
      adminToken = response.body.access_token;
    });

    it('/auth/login (POST) - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/ (GET) - should access public hello endpoint', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('/health (GET) - should access public health endpoint', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('Protected Endpoints - Authentication Required', () => {
    it('/documents (GET) - should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .expect(401);
    });

    it('/admin/documents (GET) - should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/admin/documents')
        .expect(401);
    });

    it('/query/logs (GET) - should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/query/logs')
        .expect(401);
    });
  });

  describe('Protected Endpoints - User Access', () => {
    it('/documents (GET) - should allow authenticated users', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('/query/text (POST) - should allow authenticated users', () => {
      return request(app.getHttpServer())
        .post('/query/text')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ query: 'test query' })
        .expect(201);
    });

    it('/query/voice (POST) - should allow authenticated users', () => {
      return request(app.getHttpServer())
        .post('/query/voice')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ audioData: 'base64audiodata' })
        .expect(201);
    });
  });

  describe('Protected Endpoints - Admin Only', () => {
    it('/admin/documents (GET) - should reject regular users', () => {
      return request(app.getHttpServer())
        .get('/admin/documents')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(403);
    });

    it('/admin/documents (GET) - should allow admin users', () => {
      return request(app.getHttpServer())
        .get('/admin/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('/query/logs (GET) - should reject regular users', () => {
      return request(app.getHttpServer())
        .get('/query/logs')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(403);
    });

    it('/query/logs (GET) - should allow admin users', () => {
      return request(app.getHttpServer())
        .get('/query/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('/documents/:id (DELETE) - should reject regular users', () => {
      return request(app.getHttpServer())
        .delete('/documents/test-id')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(403);
    });

    it('/documents/:id (DELETE) - should allow admin users', () => {
      return request(app.getHttpServer())
        .delete('/documents/test-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject expired tokens', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ1OTMwMH0.invalid';
      
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject malformed tokens', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with missing Bearer prefix', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', jwtToken)
        .expect(401);
    });
  });
});
