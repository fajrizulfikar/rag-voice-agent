import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private httpClient: AxiosInstance;
  private qdrantUrl: string;
  private apiKey?: string;
  private collectionName: string;

  constructor(private readonly configService: ConfigService) {
    this.qdrantUrl = this.configService.get<string>('vectorDb.url') || 'http://localhost:6333';
    this.apiKey = this.configService.get<string>('vectorDb.apiKey');
    this.collectionName =
      this.configService.get<string>('vectorDb.collectionName') ||
      'faq_documents';

    // Initialize HTTP client for Qdrant REST API
    this.httpClient = axios.create({
      baseURL: this.qdrantUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'api-key': this.apiKey }),
      },
      timeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      // Test connection and create collection if it doesn't exist
      await this.ensureCollectionExists();
      this.logger.log('Qdrant vector database initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant vector database', error);
      throw error;
    }
  }

  private async ensureCollectionExists(): Promise<void> {
    try {
      // Check if collection exists
      const response = await this.httpClient.get('/collections');
      const collections = response.data.result.collections;
      const collectionExists = collections.some(
        (collection: any) => collection.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection with proper vector configuration
        await this.httpClient.put(`/collections/${this.collectionName}`, {
          vectors: {
            size: 1536, // OpenAI text-embedding-ada-002 dimensions
            distance: 'Cosine', // Distance metric for semantic similarity
          },
        });
        this.logger.log(`Created collection '${this.collectionName}'`);
      } else {
        this.logger.log(`Collection '${this.collectionName}' already exists`);
      }
    } catch (error) {
      this.logger.error('Error ensuring collection exists', error);
      throw error;
    }
  }

  async searchSimilarDocuments(
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<any[]> {
    try {
      this.logger.debug(
        `Searching for similar documents with vector of length ${queryEmbedding.length}`,
      );

      const response = await this.httpClient.post(
        `/collections/${this.collectionName}/points/search`,
        {
          vector: queryEmbedding,
          limit,
          with_payload: true,
          with_vector: false,
        }
      );

      return response.data.result.map((result: any) => ({
        id: result.id,
        score: result.score,
        ...result.payload,
      }));
    } catch (error) {
      this.logger.error('Error searching similar documents', error);
      throw error;
    }
  }

  async storeDocument(
    documentId: string,
    embedding: number[],
    metadata: any,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Storing document ${documentId} with vector of length ${embedding.length}`,
      );

      await this.httpClient.put(
        `/collections/${this.collectionName}/points`,
        {
          points: [
            {
              id: documentId,
              vector: embedding,
              payload: metadata,
            },
          ],
        }
      );

      this.logger.debug(`Document ${documentId} stored successfully`);
    } catch (error) {
      this.logger.error(`Error storing document ${documentId}`, error);
      throw error;
    }
  }

  async updateDocument(
    documentId: string,
    embedding: number[],
    metadata: any,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Updating document ${documentId} with vector of length ${embedding.length}`,
      );

      // Use upsert for update (will overwrite if exists)
      await this.httpClient.put(
        `/collections/${this.collectionName}/points`,
        {
          points: [
            {
              id: documentId,
              vector: embedding,
              payload: metadata,
            },
          ],
        }
      );

      this.logger.debug(`Document ${documentId} updated successfully`);
    } catch (error) {
      this.logger.error(`Error updating document ${documentId}`, error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting document ${documentId} from vector database`);

      await this.httpClient.post(
        `/collections/${this.collectionName}/points/delete`,
        {
          points: [documentId],
        }
      );

      this.logger.debug(`Document ${documentId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting document ${documentId}`, error);
      throw error;
    }
  }

  async reindexAllDocuments(): Promise<void> {
    try {
      this.logger.log('Starting document reindexing process');
      
      // Delete existing collection
      await this.httpClient.delete(`/collections/${this.collectionName}`);
      this.logger.log(`Deleted collection '${this.collectionName}'`);
      
      // Recreate collection
      await this.ensureCollectionExists();
      this.logger.log('Document reindexing completed successfully');
    } catch (error) {
      this.logger.error('Error during document reindexing', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test connection by getting collections
      await this.httpClient.get('/collections');

      // Test collection access (allow 404 if collection doesn't exist yet)
      try {
        await this.httpClient.get(`/collections/${this.collectionName}`);
      } catch (collectionError) {
        // Collection might not exist yet, which is fine for health check
        if (collectionError.response?.status !== 404) {
          throw collectionError;
        }
      }

      this.logger.debug('Qdrant health check passed');
      return true;
    } catch (error) {
      this.logger.error('Qdrant health check failed', error);
      return false;
    }
  }
}
