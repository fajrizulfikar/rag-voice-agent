import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configurations from './config';
import { Document, QueryLog, User } from './entities';
import { CommonModule } from './common';
import { DocumentsModule } from './documents';
import { RagModule } from './rag';
import { AdminModule } from './admin';
import { AuthModule } from './auth';
import { DocumentProcessingModule } from './modules/document-processing/document-processing.module';
import { JwtAuthGuard } from './auth/guards';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: configurations,
    }),

    // TypeORM Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Document, QueryLog, User],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting protection
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    CommonModule,
    AuthModule,
    DocumentsModule,
    DocumentProcessingModule,
    RagModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
