import { databaseConfig } from './database.config';
import { registerAs } from '@nestjs/config';

// Application configuration
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret:
    process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
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
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
}));

// Speech Services configuration (OpenAI Whisper)
export const speechConfig = registerAs('speech', () => ({
  // Speech-to-Text using OpenAI Whisper
  whisper: {
    model: process.env.WHISPER_MODEL || 'whisper-1',
    language: process.env.WHISPER_LANGUAGE || 'en',
    responseFormat: process.env.WHISPER_RESPONSE_FORMAT || 'json',
    temperature: parseFloat(process.env.WHISPER_TEMPERATURE || '0'),
  },
  // Text-to-Speech using OpenAI TTS
  tts: {
    model: process.env.TTS_MODEL || 'tts-1',
    voice: process.env.TTS_VOICE || 'nova',
    responseFormat: process.env.TTS_RESPONSE_FORMAT || 'mp3',
    speed: parseFloat(process.env.TTS_SPEED || '1.0'),
  },
}));

export { databaseConfig };
export * from './configuration.service';
export * from './configuration.schema';

export default [
  appConfig,
  databaseConfig,
  vectorDbConfig,
  redisConfig,
  openaiConfig,
  speechConfig,
];
