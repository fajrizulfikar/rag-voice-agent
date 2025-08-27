import * as Joi from 'joi';

export const configurationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
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
  QDRANT_API_KEY: Joi.string().optional(),
  QDRANT_COLLECTION_NAME: Joi.string().default('faq_documents'),

  // Redis
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // Security
  JWT_SECRET: Joi.string().min(32).required(),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-ada-002'),

  // Google Cloud
  GOOGLE_CLOUD_PROJECT_ID: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),

  // Speech Services
  SPEECH_LANGUAGE_CODE: Joi.string().default('en-US'),
  SPEECH_MODEL: Joi.string().default('chirp'),
  TTS_LANGUAGE_CODE: Joi.string().default('en-US'),
  TTS_VOICE_NAME: Joi.string().default('en-US-Neural2-D'),

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
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_EMBEDDING_MODEL: string;
  GOOGLE_CLOUD_PROJECT_ID: string;
  GOOGLE_APPLICATION_CREDENTIALS: string;
  SPEECH_LANGUAGE_CODE: string;
  SPEECH_MODEL: string;
  TTS_LANGUAGE_CODE: string;
  TTS_VOICE_NAME: string;
  NEXT_PUBLIC_API_URL?: string;
}