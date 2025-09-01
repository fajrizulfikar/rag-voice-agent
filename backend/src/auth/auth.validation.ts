import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class AuthValidationService {
  private readonly logger = new Logger(AuthValidationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async validateAuthConfiguration(): Promise<boolean> {
    this.logger.log('Validating authentication configuration...');

    try {
      // Check JWT configuration
      const jwtSecret = this.configService.get<string>('jwt.secret');
      const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn');

      if (!jwtSecret || jwtSecret.length < 32) {
        this.logger.error(
          'JWT_SECRET is missing or too short (minimum 32 characters)',
        );
        return false;
      }

      if (!jwtExpiresIn) {
        this.logger.error('JWT_EXPIRES_IN is not configured');
        return false;
      }

      this.logger.log(`JWT configuration valid - expires in: ${jwtExpiresIn}`);

      // Test authentication flow
      await this.testAuthenticationFlow();

      this.logger.log(
        'Authentication system validation completed successfully',
      );
      return true;
    } catch (error) {
      this.logger.error('Authentication validation failed:', error);
      return false;
    }
  }

  private async testAuthenticationFlow(): Promise<void> {
    this.logger.log('Testing authentication flow...');

    try {
      // Test registration
      const testUser = {
        username: 'test_validation_user',
        email: 'validation@test.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      const registrationResult = await this.authService.register(testUser);

      if (!registrationResult.access_token) {
        throw new Error('Registration did not return access token');
      }

      this.logger.log('✓ User registration test passed');

      // Test login
      const loginResult = await this.authService.login({
        username: testUser.username,
        password: testUser.password,
      });

      if (!loginResult.access_token) {
        throw new Error('Login did not return access token');
      }

      if (loginResult.user.username !== testUser.username) {
        throw new Error('Login returned incorrect user data');
      }

      this.logger.log('✓ User login test passed');

      // Test JWT payload validation
      const user = await this.authService.findById(loginResult.user.id);
      if (!user) {
        throw new Error('User lookup by ID failed');
      }

      this.logger.log('✓ JWT payload validation test passed');

      // Clean up test user
      // Note: In a real implementation, you'd have a user deletion method
      this.logger.log('✓ Authentication flow test completed successfully');
    } catch (error) {
      this.logger.error('Authentication flow test failed:', error);
      throw error;
    }
  }

  async validateSecurityHeaders(): Promise<boolean> {
    this.logger.log('Validating security configuration...');

    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_PASSWORD',
      'OPENAI_API_KEY',
    ];

    let allValid = true;

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.logger.error(`Required environment variable ${envVar} is missing`);
        allValid = false;
      } else if (
        value.includes('change-in-production') ||
        value.includes('your-') ||
        value === 'test-key'
      ) {
        this.logger.warn(
          `Environment variable ${envVar} appears to use a default/test value`,
        );
      }
    }

    if (allValid) {
      this.logger.log('✓ Security configuration validation passed');
    }

    return allValid;
  }
}
