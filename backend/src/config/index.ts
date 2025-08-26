import { databaseConfig } from './database.config';
import { registerAs } from '@nestjs/config';

// Application configuration
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
}));

// Vector database configuration (Qdrant)
export const vectorDbConfig = registerAs('vectorDb', () => ({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
  collectionName: process.env.QDRANT_COLLECTION_NAME || 'faq_documents',
}));

// Redis configuration
export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
  password: process.env.REDIS_PASSWORD,
}));

// OpenAI configuration
export const openaiConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
}));

// Google Cloud configuration
export const googleCloudConfig = registerAs('googleCloud', () => ({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  speechToTextConfig: {
    languageCode: process.env.SPEECH_LANGUAGE_CODE || 'en-US',
    model: process.env.SPEECH_MODEL || 'chirp',
  },
  textToSpeechConfig: {
    languageCode: process.env.TTS_LANGUAGE_CODE || 'en-US',
    voiceName: process.env.TTS_VOICE_NAME || 'en-US-Neural2-D',
  },
}));

export { databaseConfig };

export default [
  appConfig,
  databaseConfig,
  vectorDbConfig,
  redisConfig,
  openaiConfig,
  googleCloudConfig,
];