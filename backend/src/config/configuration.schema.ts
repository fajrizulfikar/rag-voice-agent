import * as Joi from 'joi';

export const configurationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_URL: Joi.string().optional(),

  // Vector Database (Qdrant)
  QDRANT_URL: Joi.string().uri().required(),
  QDRANT_API_KEY: Joi.string().allow('').optional(),
  QDRANT_COLLECTION_NAME: Joi.string().default('faq_documents'),

  // Redis
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Security - JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-ada-002'),

  // OpenAI Speech Services (Whisper & TTS)
  WHISPER_MODEL: Joi.string().default('whisper-1'),
  WHISPER_LANGUAGE: Joi.string().default('en'),
  WHISPER_RESPONSE_FORMAT: Joi.string().valid('json', 'text', 'srt', 'verbose_json', 'vtt').default('json'),
  WHISPER_TEMPERATURE: Joi.number().min(0).max(1).default(0),
  TTS_MODEL: Joi.string().valid('tts-1', 'tts-1-hd').default('tts-1'),
  TTS_VOICE: Joi.string().valid('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer').default('nova'),
  TTS_RESPONSE_FORMAT: Joi.string().valid('mp3', 'opus', 'aac', 'flac').default('mp3'),
  TTS_SPEED: Joi.number().min(0.25).max(4.0).default(1.0),

  // Frontend
  NEXT_PUBLIC_API_URL: Joi.string().uri().optional(),
});

export interface ConfigurationVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  DATABASE_URL?: string;
  QDRANT_URL: string;
  QDRANT_API_KEY?: string;
  QDRANT_COLLECTION_NAME: string;
  REDIS_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_EMBEDDING_MODEL: string;
  WHISPER_MODEL: string;
  WHISPER_LANGUAGE: string;
  WHISPER_RESPONSE_FORMAT: string;
  WHISPER_TEMPERATURE: number;
  TTS_MODEL: string;
  TTS_VOICE: string;
  TTS_RESPONSE_FORMAT: string;
  TTS_SPEED: number;
  NEXT_PUBLIC_API_URL?: string;
}
