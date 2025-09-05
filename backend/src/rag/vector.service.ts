import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

// Define our own interfaces since type exports may vary by Qdrant client version
interface SearchOptions {
  filter?: any;
  limit?: number;
  offset?: number;
  withPayload?: boolean;
  withVector?: boolean;
  scoreThreshold?: number;
}

interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

interface SearchResult {
  id: string;
  score: number;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  vector?: number[];
}

interface CollectionInfo {
  name: string;
  vectorsCount: number;
  indexedVectorsCount: number;
  payloadSchema: Record<string, any>;
  status: string;
}

type DistanceMetric = 'Cosine' | 'Dot' | 'Euclid' | 'Manhattan';

@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private qdrantClient: QdrantClient;
  private qdrantUrl: string;
  private apiKey?: string;
  private collectionName: string;
  private vectorSize: number;
  private distanceMetric: DistanceMetric;
  private maxRetries: number;
  private retryDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.qdrantUrl =
      this.configService.get<string>('vectorDb.url') || 'http://localhost:6333';
    this.apiKey = this.configService.get<string>('vectorDb.apiKey');
    this.collectionName =
      this.configService.get<string>('vectorDb.collectionName') ||
      'faq_documents';
    this.vectorSize =
      this.configService.get<number>('vectorDb.vectorSize') || 1536;
    this.distanceMetric =
      (this.configService.get<string>(
        'vectorDb.distanceMetric',
      ) as DistanceMetric) || 'Cosine';
    this.maxRetries =
      this.configService.get<number>('vectorDb.maxRetries') || 3;
    this.retryDelay =
      this.configService.get<number>('vectorDb.retryDelay') || 1000;

    // Initialize HTTP client for Qdrant REST API
    this.qdrantClient = new QdrantClient({
      url: this.qdrantUrl,
      apiKey: this.apiKey,
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
      const exists = await this.qdrantClient.collectionExists(
        this.collectionName,
      );

      if (!exists) {
        // Create collection with proper vector configuration
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: this.distanceMetric,
          },
          // Enable on-disk payload storage for better memory usage
          optimizers_config: {
            deleted_threshold: 0.2,
            vacuum_min_vector_number: 1000,
            default_segment_number: 0,
            max_segment_size: 200000,
            memmap_threshold: 50000,
            indexing_threshold: 20000,
            flush_interval_sec: 5,
            max_optimization_threads: 1,
          },
          // Enable WAL for durability
          wal_config: {
            wal_capacity_mb: 32,
            wal_segments_ahead: 0,
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
    this.logger.debug(
      `Searching for similar documents with vector of length ${queryEmbedding.length}`,
    );

    return this.executeWithRetry(async () => {
      const response = await this.qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        with_payload: true,
        with_vector: false,
      });

      return response.map(({ id, score, payload }) => ({
        id,
        score,
        title:
          (payload?.metadata as any)?.title ||
          payload?.title ||
          `Document ${id}`,
        content: payload?.content,
        metadata: payload?.metadata,
        ...payload,
      }));
    });
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

      await this.qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: documentId,
            vector: embedding,
            payload: metadata,
          },
        ],
      });

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
      await this.qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: documentId,
            vector: embedding,
            payload: metadata,
          },
        ],
      });

      this.logger.debug(`Document ${documentId} updated successfully`);
    } catch (error) {
      this.logger.error(`Error updating document ${documentId}`, error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting document ${documentId} from vector database`);

      await this.qdrantClient.delete(this.collectionName, {
        points: [documentId],
      });

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
      await this.qdrantClient.deleteCollection(this.collectionName);
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
      await this.qdrantClient.getCollections();

      const { exists } = await this.qdrantClient.collectionExists(
        this.collectionName,
      );

      this.logger.debug(
        exists
          ? 'Qdrant health check passed'
          : `Qdrant health check passed (collection '${this.collectionName}' not found yet)`,
      );
      return true;
    } catch (error) {
      this.logger.error('Qdrant health check failed', error);
      return false;
    }
  }

  // Enhanced search method with options
  async searchSimilarDocumentsAdvanced(
    queryEmbedding: number[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      limit = 5,
      offset = 0,
      filter,
      withPayload = true,
      withVector = false,
      scoreThreshold,
    } = options;

    return this.executeWithRetry(async () => {
      this.logger.debug(
        `Advanced search for similar documents with vector of length ${queryEmbedding.length}`,
      );

      const searchParams: any = {
        vector: queryEmbedding,
        limit,
        offset,
        with_payload: withPayload,
        with_vector: withVector,
      };

      if (filter) {
        searchParams.filter = filter;
      }

      if (scoreThreshold !== undefined) {
        searchParams.score_threshold = scoreThreshold;
      }

      const response = await this.qdrantClient.search(
        this.collectionName,
        searchParams,
      );

      return response.map(({ id, score, payload, vector }) => {
        const result: SearchResult = {
          id: id.toString(),
          score,
        };

        if (payload) {
          result.content = payload.content as string;
          result.metadata = payload.metadata as Record<string, any>;
          // Extract title from metadata or use a fallback
          result.title =
            (payload.metadata as any)?.title ||
            payload.title ||
            `Document ${id}`;
        }

        if (vector && Array.isArray(vector)) {
          result.vector = vector as number[];
        }

        return result;
      });
    });
  }

  // Batch operations for better performance
  async storeDocumentsBatch(
    documents: VectorDocument[],
    batchSize: number = 100,
  ): Promise<void> {
    if (!documents.length) {
      this.logger.debug('No documents to store in batch');
      return;
    }

    // Validate all documents have embeddings
    const invalidDocs = documents.filter((doc) => !doc.embedding);
    if (invalidDocs.length > 0) {
      throw new Error(`${invalidDocs.length} documents missing embeddings`);
    }

    return this.executeWithRetry(async () => {
      this.logger.debug(`Storing batch of ${documents.length} documents`);

      // Process documents in batches to avoid memory issues
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const points = batch.map((document) => {
          const payload: Record<string, any> = {
            content: document.content,
            timestamp: new Date().toISOString(),
          };

          if (document.metadata) {
            payload.metadata = document.metadata;
          }

          return {
            id: document.id,
            vector: document.embedding!,
            payload,
          };
        });

        await this.qdrantClient.upsert(this.collectionName, {
          points,
        });

        this.logger.debug(
          `Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            documents.length / batchSize,
          )}`,
        );
      }

      this.logger.debug(
        `Batch storage completed for ${documents.length} documents`,
      );
    });
  }

  async deleteDocumentsBatch(documentIds: string[]): Promise<void> {
    if (!documentIds.length) {
      this.logger.debug('No documents to delete in batch');
      return;
    }

    return this.executeWithRetry(async () => {
      this.logger.debug(`Deleting batch of ${documentIds.length} documents`);

      await this.qdrantClient.delete(this.collectionName, {
        points: documentIds,
      });

      this.logger.debug(
        `Batch deletion completed for ${documentIds.length} documents`,
      );
    });
  }

  // Collection management and utilities
  async getCollectionInfo(): Promise<CollectionInfo> {
    return this.executeWithRetry(async () => {
      const info = await this.qdrantClient.getCollection(this.collectionName);
      return {
        name: this.collectionName,
        vectorsCount: info.vectors_count || 0,
        indexedVectorsCount: info.indexed_vectors_count || 0,
        payloadSchema: info.payload_schema || {},
        status: info.status || 'unknown',
      };
    });
  }

  async countDocuments(filter?: any): Promise<number> {
    return this.executeWithRetry(async () => {
      const response = await this.qdrantClient.count(this.collectionName, {
        filter,
        exact: true,
      });
      return response.count;
    });
  }

  async getDocument(documentId: string): Promise<SearchResult | null> {
    return this.executeWithRetry(async () => {
      const response = await this.qdrantClient.retrieve(this.collectionName, {
        ids: [documentId],
        with_payload: true,
        with_vector: false,
      });

      if (!response.length) {
        return null;
      }

      const point = response[0];
      return {
        id: point.id.toString(),
        score: 1.0,
        title:
          (point.payload?.metadata as any)?.title ||
          point.payload?.title ||
          `Document ${point.id}`,
        content: point.payload?.content as string,
        metadata: point.payload?.metadata as Record<string, any>,
      };
    });
  }

  // Enhanced document storage with better interface
  async storeDocumentEnhanced(document: VectorDocument): Promise<void> {
    if (!document.embedding) {
      throw new Error('Document must have an embedding vector');
    }

    return this.executeWithRetry(async () => {
      this.logger.debug(
        `Storing enhanced document ${document.id} with vector of length ${document.embedding!.length}`,
      );

      const payload: Record<string, any> = {
        content: document.content,
        timestamp: new Date().toISOString(),
      };

      if (document.metadata) {
        payload.metadata = document.metadata;
      }

      await this.qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: document.id,
            vector: document.embedding!,
            payload,
          },
        ],
      });

      this.logger.debug(`Enhanced document ${document.id} stored successfully`);
    });
  }

  // Error handling and retry logic
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Operation failed (attempt ${attempt}/${this.maxRetries}): ${lastError.message}`,
        );

        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    this.logger.error(
      `Operation failed after ${this.maxRetries} attempts: ${lastError!.message}`,
    );
    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Create collection snapshot for backup
  async createSnapshot(): Promise<string> {
    return this.executeWithRetry(async () => {
      this.logger.log(
        `Creating snapshot for collection ${this.collectionName}`,
      );
      const response = await this.qdrantClient.createSnapshot(
        this.collectionName,
      );
      if (!response) {
        throw new Error('Failed to create snapshot: No response received');
      }
      this.logger.log(`Snapshot created: ${response.name}`);
      return response.name;
    });
  }

  // Optimize collection for better performance
  async optimizeCollection(): Promise<void> {
    return this.executeWithRetry(async () => {
      this.logger.log(`Optimizing collection ${this.collectionName}`);
      await this.qdrantClient.updateCollection(this.collectionName, {
        optimizers_config: {
          deleted_threshold: 0.2,
          vacuum_min_vector_number: 1000,
          default_segment_number: 0,
          max_segment_size: 200000,
          memmap_threshold: 50000,
          indexing_threshold: 20000,
          flush_interval_sec: 5,
          max_optimization_threads: 2,
        },
      });
      this.logger.log(`Collection ${this.collectionName} optimized`);
    });
  }
}
