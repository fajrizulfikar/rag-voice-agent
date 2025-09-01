import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  configurationSchema,
  ConfigurationVariables,
} from './configuration.schema';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  private validatedConfig: ConfigurationVariables;

  constructor(private configService: ConfigService) {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const config = {
      NODE_ENV: this.configService.get('NODE_ENV'),
      PORT: this.configService.get('PORT'),
      DATABASE_HOST: this.configService.get('DATABASE_HOST'),
      DATABASE_PORT: this.configService.get('DATABASE_PORT'),
      DATABASE_USERNAME: this.configService.get('DATABASE_USERNAME'),
      DATABASE_PASSWORD: this.configService.get('DATABASE_PASSWORD'),
      DATABASE_NAME: this.configService.get('DATABASE_NAME'),
      DATABASE_URL: this.configService.get('DATABASE_URL'),
      QDRANT_URL: this.configService.get('QDRANT_URL'),
      QDRANT_API_KEY: this.configService.get('QDRANT_API_KEY'),
      QDRANT_COLLECTION_NAME: this.configService.get('QDRANT_COLLECTION_NAME'),
      REDIS_URL: this.configService.get('REDIS_URL'),
      REDIS_HOST: this.configService.get('REDIS_HOST'),
      REDIS_PORT: this.configService.get('REDIS_PORT'),
      REDIS_PASSWORD: this.configService.get('REDIS_PASSWORD'),
      JWT_SECRET: this.configService.get('JWT_SECRET'),
      OPENAI_API_KEY: this.configService.get('OPENAI_API_KEY'),
      OPENAI_MODEL: this.configService.get('OPENAI_MODEL'),
      OPENAI_EMBEDDING_MODEL: this.configService.get('OPENAI_EMBEDDING_MODEL'),
      WHISPER_MODEL: this.configService.get('WHISPER_MODEL'),
      WHISPER_LANGUAGE: this.configService.get('WHISPER_LANGUAGE'),
      WHISPER_RESPONSE_FORMAT: this.configService.get(
        'WHISPER_RESPONSE_FORMAT',
      ),
      WHISPER_TEMPERATURE: this.configService.get('WHISPER_TEMPERATURE'),
      TTS_MODEL: this.configService.get('TTS_MODEL'),
      TTS_VOICE: this.configService.get('TTS_VOICE'),
      TTS_RESPONSE_FORMAT: this.configService.get('TTS_RESPONSE_FORMAT'),
      TTS_SPEED: this.configService.get('TTS_SPEED'),
      NEXT_PUBLIC_API_URL: this.configService.get('NEXT_PUBLIC_API_URL'),
    };

    const { error, value } = configurationSchema.validate(config, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      this.logger.error('Configuration validation failed:');
      error.details.forEach((detail) => {
        this.logger.error(`- ${detail.message}`);
      });
      throw new Error('Invalid configuration');
    }

    this.validatedConfig = value;
    this.logger.log('Configuration validation successful');
  }

  // Application configuration
  get nodeEnv(): string {
    return this.validatedConfig.NODE_ENV;
  }

  get port(): number {
    return this.validatedConfig.PORT;
  }

  get isDevelopment(): boolean {
    return this.validatedConfig.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.validatedConfig.NODE_ENV === 'production';
  }

  // Database configuration
  get database() {
    return {
      host: this.validatedConfig.DATABASE_HOST,
      port: this.validatedConfig.DATABASE_PORT,
      username: this.validatedConfig.DATABASE_USERNAME,
      password: this.validatedConfig.DATABASE_PASSWORD,
      database: this.validatedConfig.DATABASE_NAME,
      url: this.validatedConfig.DATABASE_URL,
    };
  }

  // Vector database configuration
  get vectorDatabase() {
    return {
      url: this.validatedConfig.QDRANT_URL,
      apiKey: this.validatedConfig.QDRANT_API_KEY,
      collectionName: this.validatedConfig.QDRANT_COLLECTION_NAME,
    };
  }

  // Redis configuration
  get redis() {
    return {
      url: this.validatedConfig.REDIS_URL,
      host: this.validatedConfig.REDIS_HOST,
      port: this.validatedConfig.REDIS_PORT,
      password: this.validatedConfig.REDIS_PASSWORD,
    };
  }

  // Security configuration
  get security() {
    return {
      jwtSecret: this.validatedConfig.JWT_SECRET,
    };
  }

  // OpenAI configuration
  get openai() {
    return {
      apiKey: this.validatedConfig.OPENAI_API_KEY,
      model: this.validatedConfig.OPENAI_MODEL,
      embeddingModel: this.validatedConfig.OPENAI_EMBEDDING_MODEL,
    };
  }

  // Speech Services configuration (OpenAI Whisper & TTS)
  get speech() {
    return {
      whisper: {
        model: this.validatedConfig.WHISPER_MODEL,
        language: this.validatedConfig.WHISPER_LANGUAGE,
        responseFormat: this.validatedConfig.WHISPER_RESPONSE_FORMAT,
        temperature: this.validatedConfig.WHISPER_TEMPERATURE,
      },
      tts: {
        model: this.validatedConfig.TTS_MODEL,
        voice: this.validatedConfig.TTS_VOICE,
        responseFormat: this.validatedConfig.TTS_RESPONSE_FORMAT,
        speed: this.validatedConfig.TTS_SPEED,
      },
    };
  }

  // Frontend configuration
  get frontend() {
    return {
      apiUrl: this.validatedConfig.NEXT_PUBLIC_API_URL,
    };
  }

  // Utility methods
  validateApiKeys(): { [key: string]: boolean } {
    const apiKeys = {
      openai:
        !!this.validatedConfig.OPENAI_API_KEY &&
        this.validatedConfig.OPENAI_API_KEY !== 'your-openai-api-key',
      qdrant:
        !this.validatedConfig.QDRANT_API_KEY ||
        this.validatedConfig.QDRANT_API_KEY.length > 0,
      speech:
        !!this.validatedConfig.OPENAI_API_KEY &&
        this.validatedConfig.OPENAI_API_KEY !== 'your-openai-api-key',
      jwt:
        !!this.validatedConfig.JWT_SECRET &&
        this.validatedConfig.JWT_SECRET !==
          'your-super-secret-jwt-key-change-this-in-production',
    };

    return apiKeys;
  }

  getConfigurationSummary() {
    const apiKeyStatus = this.validateApiKeys();

    return {
      environment: this.validatedConfig.NODE_ENV,
      port: this.validatedConfig.PORT,
      database: {
        host: this.validatedConfig.DATABASE_HOST,
        port: this.validatedConfig.DATABASE_PORT,
        database: this.validatedConfig.DATABASE_NAME,
      },
      vectorDatabase: {
        url: this.validatedConfig.QDRANT_URL,
        collection: this.validatedConfig.QDRANT_COLLECTION_NAME,
      },
      speech: {
        provider: 'OpenAI Whisper & TTS',
        whisperModel: this.validatedConfig.WHISPER_MODEL,
        ttsModel: this.validatedConfig.TTS_MODEL,
        ttsVoice: this.validatedConfig.TTS_VOICE,
      },
      apiKeys: {
        openai: apiKeyStatus.openai ? 'configured' : 'missing/placeholder',
        qdrant: apiKeyStatus.qdrant ? 'configured' : 'missing',
        speech: apiKeyStatus.speech ? 'configured' : 'missing/placeholder',
        jwt: apiKeyStatus.jwt ? 'configured' : 'missing/placeholder',
      },
    };
  }
}
