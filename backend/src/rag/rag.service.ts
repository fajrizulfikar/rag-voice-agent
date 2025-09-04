import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryLog, QueryType } from '../entities';
import { VectorService } from './vector.service';
import { EmbeddingService } from './embedding.service';
import { TextQueryDto, VoiceQueryDto, QueryResponse } from './dto';

interface EnhancedQueryOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: any;
  includeMetadata?: boolean;
}

interface DocumentUpload {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  source?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @InjectRepository(QueryLog)
    private readonly queryLogRepository: Repository<QueryLog>,
    private readonly vectorService: VectorService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async processTextQuery(textQueryDto: TextQueryDto): Promise<QueryResponse> {
    const { query, userId } = textQueryDto;

    // Log the query
    const queryLog = await this.logQuery({
      query,
      sessionId: userId,
      queryType: QueryType.TEXT,
    });

    try {
      // Generate embedding for the query
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);

      // Search for similar documents in vector database with enhanced options
      const searchOptions: EnhancedQueryOptions = {
        limit: 5,
        scoreThreshold: 0.7, // Only return results with good similarity
        includeMetadata: true,
      };

      const similarDocuments =
        await this.vectorService.searchSimilarDocumentsAdvanced(
          queryEmbedding,
          searchOptions,
        );

      // Generate answer using retrieved context (placeholder for now)
      const answer = await this.generateAnswer(query, similarDocuments);

      // Update query log with results
      await this.updateQueryLog(queryLog.id, {
        response: answer,
        documentsRetrieved: similarDocuments.length,
        responseTime: Date.now() - queryLog.createdAt.getTime(),
      });

      return {
        answer,
        sources: similarDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title || `Document ${doc.id}`,
          content: doc.content || '',
          score: doc.score,
        })),
        queryId: queryLog.id,
      };
    } catch (error) {
      // Update query log with error
      await this.updateQueryLog(queryLog.id, {
        errorMessage: error.message,
        responseTime: Date.now() - queryLog.createdAt.getTime(),
      });

      throw error;
    }
  }

  async processVoiceQuery(
    voiceQueryDto: VoiceQueryDto,
  ): Promise<QueryResponse> {
    // Placeholder for voice processing - will be implemented in Stage 3
    // For now, extract text from the voice data and process as text query
    const { audioData, userId } = voiceQueryDto;

    // TODO: Implement speech-to-text conversion
    const transcribedText = 'Placeholder transcription';

    return await this.processTextQuery({
      query: transcribedText,
      userId,
    });
  }

  private async generateAnswer(
    query: string,
    documents: any[],
  ): Promise<string> {
    // Placeholder for LLM answer generation - will be implemented in Stage 2
    if (documents.length === 0) {
      return "I couldn't find any relevant information to answer your question. Please try rephrasing your query.";
    }

    return `Based on the available documentation, here's what I found: ${documents[0]?.title || 'relevant information'}. This is a placeholder response that will be replaced with actual LLM-generated answers in Stage 2.`;
  }

  private async logQuery(data: Partial<QueryLog>): Promise<QueryLog> {
    const queryLog = this.queryLogRepository.create(data);
    return await this.queryLogRepository.save(queryLog);
  }

  private async updateQueryLog(
    id: string,
    updates: Partial<QueryLog>,
  ): Promise<void> {
    await this.queryLogRepository.update(id, updates);
  }

  async getQueryLogs(): Promise<QueryLog[]> {
    return await this.queryLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 100, // Limit to last 100 queries
    });
  }

  async getQueryLog(id: string): Promise<QueryLog> {
    const queryLog = await this.queryLogRepository.findOne({ where: { id } });
    if (!queryLog) {
      throw new NotFoundException(`Query log with ID ${id} not found`);
    }
    return queryLog;
  }

  // Enhanced document management methods
  async uploadDocument(document: DocumentUpload): Promise<void> {
    try {
      this.logger.debug(`Uploading document: ${document.id}`);

      // Generate embedding for the document content
      const embedding = await this.embeddingService.generateEmbedding(
        document.content,
      );

      // Store in vector database with enhanced metadata
      const vectorDocument = {
        id: document.id,
        content: document.content,
        embedding,
        metadata: {
          ...document.metadata,
          uploadedAt: new Date().toISOString(),
          source: document.source || 'manual_upload',
          contentLength: document.content.length,
          wordCount: document.content.split(/\s+/).length,
        },
      };

      await this.vectorService.storeDocumentEnhanced(vectorDocument);
      this.logger.log(`Document ${document.id} uploaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to upload document ${document.id}:`, error);
      throw error;
    }
  }

  async uploadDocumentsBatch(documents: DocumentUpload[]): Promise<void> {
    try {
      this.logger.debug(`Uploading batch of ${documents.length} documents`);

      // Generate embeddings for all documents
      const contents = documents.map((doc) => doc.content);
      const embeddings =
        await this.embeddingService.generateEmbeddings(contents);

      // Prepare vector documents with embeddings
      const vectorDocuments = documents.map((doc, index) => ({
        id: doc.id,
        content: doc.content,
        embedding: embeddings[index],
        metadata: {
          ...doc.metadata,
          uploadedAt: new Date().toISOString(),
          source: doc.source || 'batch_upload',
          contentLength: doc.content.length,
          wordCount: doc.content.split(/\s+/).length,
        },
      }));

      await this.vectorService.storeDocumentsBatch(vectorDocuments);
      this.logger.log(
        `Batch upload completed for ${documents.length} documents`,
      );
    } catch (error) {
      this.logger.error(`Failed to upload document batch:`, error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.vectorService.deleteDocument(documentId);
      this.logger.log(`Document ${documentId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId}:`, error);
      throw error;
    }
  }

  async updateDocument(document: DocumentUpload): Promise<void> {
    try {
      this.logger.debug(`Updating document: ${document.id}`);

      // Check if document exists
      const existingDoc = await this.vectorService.getDocument(document.id);
      if (!existingDoc) {
        throw new NotFoundException(`Document ${document.id} not found`);
      }

      // Generate new embedding
      const embedding = await this.embeddingService.generateEmbedding(
        document.content,
      );

      // Update with new content and metadata
      const vectorDocument = {
        id: document.id,
        content: document.content,
        embedding,
        metadata: {
          ...document.metadata,
          lastUpdated: new Date().toISOString(),
          source: document.source || 'manual_update',
          contentLength: document.content.length,
          wordCount: document.content.split(/\s+/).length,
        },
      };

      await this.vectorService.storeDocumentEnhanced(vectorDocument);
      this.logger.log(`Document ${document.id} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to update document ${document.id}:`, error);
      throw error;
    }
  }

  // Advanced query methods
  async searchDocuments(
    query: string,
    options: EnhancedQueryOptions = {},
  ): Promise<any[]> {
    try {
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);

      const searchResults =
        await this.vectorService.searchSimilarDocumentsAdvanced(
          queryEmbedding,
          {
            limit: options.limit || 10,
            scoreThreshold: options.scoreThreshold || 0.5,
            filter: options.filter,
            withPayload: true,
          },
        );

      return searchResults.map((result) => ({
        id: result.id,
        score: result.score,
        content: result.content,
        metadata: result.metadata,
      }));
    } catch (error) {
      this.logger.error('Error in document search:', error);
      throw error;
    }
  }

  // Vector database management
  async getVectorDatabaseInfo(): Promise<any> {
    try {
      const collectionInfo = await this.vectorService.getCollectionInfo();
      const documentCount = await this.vectorService.countDocuments();
      const isHealthy = await this.vectorService.healthCheck();

      return {
        ...collectionInfo,
        totalDocuments: documentCount,
        healthy: isHealthy,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting vector database info:', error);
      throw error;
    }
  }

  async createDatabaseSnapshot(): Promise<string> {
    try {
      this.logger.log('Creating vector database snapshot');
      const snapshotName = await this.vectorService.createSnapshot();
      this.logger.log(`Snapshot created: ${snapshotName}`);
      return snapshotName;
    } catch (error) {
      this.logger.error('Error creating database snapshot:', error);
      throw error;
    }
  }

  async optimizeVectorDatabase(): Promise<void> {
    try {
      this.logger.log('Starting vector database optimization');
      await this.vectorService.optimizeCollection();
      this.logger.log('Vector database optimization completed');
    } catch (error) {
      this.logger.error('Error optimizing vector database:', error);
      throw error;
    }
  }

  async reindexVectorDatabase(): Promise<void> {
    try {
      this.logger.log('Starting vector database reindexing');
      await this.vectorService.reindexAllDocuments();
      this.logger.log('Vector database reindexing completed');
    } catch (error) {
      this.logger.error('Error reindexing vector database:', error);
      throw error;
    }
  }
}
