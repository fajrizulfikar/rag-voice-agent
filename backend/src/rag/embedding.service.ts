import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openaiClient: OpenAI;
  private embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.openaiClient = new OpenAI({
      apiKey,
    });

    // Keep using ada-002 to match the 1536 vector dimensions in Qdrant
    this.embeddingModel =
      this.configService.get<string>('openai.embeddingModel') ||
      'text-embedding-ada-002';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    this.logger.debug(`Generating embedding for text of length ${text.length}`);

    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      return response.data[0].embedding;
    } catch (error: any) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter((text) => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts provided for embedding generation');
    }

    this.logger.debug(`Generating embeddings for ${validTexts.length} texts`);

    try {
      // OpenAI supports batch embedding generation
      const batchSize = 100; // Conservative batch size
      const embeddings: number[][] = [];

      for (let i = 0; i < validTexts.length; i += batchSize) {
        const batch = validTexts.slice(i, i + batchSize);

        const response = await this.openaiClient.embeddings.create({
          model: this.embeddingModel,
          input: batch,
        });

        if (!response.data || response.data.length === 0) {
          throw new Error('No embedding data received from OpenAI');
        }

        // Add embeddings in the same order as the input texts
        for (const embedding of response.data) {
          embeddings.push(embedding.embedding);
        }
      }

      return embeddings;
    } catch (error: any) {
      this.logger.error(`Failed to generate embeddings: ${error.message}`);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  async calculateSimilarity(
    embedding1: number[],
    embedding2: number[],
  ): Promise<number> {
    // Calculate cosine similarity
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding dimensions must match');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }
}
