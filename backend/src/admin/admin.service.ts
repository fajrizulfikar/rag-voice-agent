import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DocumentsService } from '../documents';
import { CreateDocumentDto } from '../documents/dto';
import { RagService, VectorService, EmbeddingService } from '../rag';
import { UploadDocumentDto, ReindexDto } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ragService: RagService,
    private readonly vectorService: VectorService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
  ) {
    this.logger.log(`Uploading document: ${file.originalname}`);

    // Extract text content based on file type
    const content = await this.extractTextContent(file);

    // Create document in database - ensure proper CreateDocumentDto structure
    const createDocumentDto: CreateDocumentDto = {
      title: uploadDocumentDto.title || file.originalname,
      content,
      category: uploadDocumentDto.category,
      tags: uploadDocumentDto.tags,
      sourceUrl: uploadDocumentDto.sourceUrl,
      metadata: JSON.stringify({
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }),
    };
    const document = await this.documentsService.create(createDocumentDto);

    // Generate embedding and store in vector database (placeholder for now)
    const embedding = await this.embeddingService.generateEmbedding(content);
    await this.vectorService.storeDocument(document.id, embedding, {
      title: document.title,
      category: document.category,
      tags: document.tags,
    });

    return {
      success: true,
      documentId: document.id,
      message: 'Document uploaded and indexed successfully',
    };
  }

  async uploadTextDocument(uploadDocumentDto: UploadDocumentDto) {
    this.logger.log(`Creating text document: ${uploadDocumentDto.title}`);

    if (!uploadDocumentDto.content) {
      throw new BadRequestException('Content is required for text documents');
    }

    if (!uploadDocumentDto.title) {
      throw new BadRequestException('Title is required for text documents');
    }

    // Create document in database - transform UploadDocumentDto to CreateDocumentDto
    const createDocumentDto: CreateDocumentDto = {
      title: uploadDocumentDto.title,
      content: uploadDocumentDto.content,
      category: uploadDocumentDto.category,
      tags: uploadDocumentDto.tags,
      sourceUrl: uploadDocumentDto.sourceUrl,
    };
    const document = await this.documentsService.create(createDocumentDto);

    // Generate embedding and store in vector database
    const embedding = await this.embeddingService.generateEmbedding(
      uploadDocumentDto.content,
    );
    await this.vectorService.storeDocument(document.id, embedding, {
      title: document.title,
      category: document.category,
      tags: document.tags,
    });

    return {
      success: true,
      documentId: document.id,
      message: 'Text document created and indexed successfully',
    };
  }

  async getAllDocuments() {
    return await this.documentsService.findAll();
  }

  async getDocument(id: string) {
    return await this.documentsService.findOne(id);
  }

  async deleteDocument(id: string) {
    // Remove from vector database
    await this.vectorService.deleteDocument(id);

    // Remove from main database
    await this.documentsService.remove(id);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async getQueryLogs() {
    return await this.ragService.getQueryLogs();
  }

  async getQueryLog(id: string) {
    return await this.ragService.getQueryLog(id);
  }

  async reindexVectorDatabase(reindexDto: ReindexDto) {
    this.logger.log('Starting vector database reindexing');

    try {
      if (reindexDto.fullReindex) {
        // Full reindex of all documents
        await this.vectorService.reindexAllDocuments();
      } else if (reindexDto.documentIds && reindexDto.documentIds.length > 0) {
        // Reindex specific documents
        for (const documentId of reindexDto.documentIds) {
          const document = await this.documentsService.findOne(documentId);
          const embedding = await this.embeddingService.generateEmbedding(
            document.content,
          );
          await this.vectorService.updateDocument(documentId, embedding, {
            title: document.title,
            category: document.category,
            tags: document.tags,
          });
        }
      }

      return {
        success: true,
        message: 'Vector database reindexing completed successfully',
        reindexedDocuments: reindexDto.documentIds?.length || 'all',
      };
    } catch (error) {
      this.logger.error('Reindexing failed:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    const databaseHealth = true; // This will be implemented with actual health checks
    const vectorDatabaseHealth = await this.vectorService.healthCheck();

    return {
      status: databaseHealth && vectorDatabaseHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealth ? 'up' : 'down',
        vectorDatabase: vectorDatabaseHealth ? 'up' : 'down',
      },
    };
  }

  async getSystemStats() {
    const documents = await this.documentsService.findAll();
    const queryLogs = await this.ragService.getQueryLogs();

    return {
      totalDocuments: documents.length,
      totalQueries: queryLogs.length,
      recentQueries: queryLogs.slice(0, 10),
      documentsByCategory: this.groupDocumentsByCategory(documents),
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  private async extractTextContent(file: Express.Multer.File): Promise<string> {
    // Placeholder implementation - in a real application, you would use libraries like:
    // - pdf-parse for PDF files
    // - mammoth for DOCX files
    // - xlsx for Excel files
    // - etc.

    if (file.mimetype.startsWith('text/')) {
      return file.buffer.toString('utf-8');
    }

    // For non-text files, return a placeholder
    return `Content extracted from ${file.originalname} (${file.mimetype}). This is a placeholder - actual text extraction will be implemented in Stage 2.`;
  }

  private groupDocumentsByCategory(documents: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    documents.forEach((doc) => {
      const category = doc.category || 'Uncategorized';
      grouped[category] = (grouped[category] || 0) + 1;
    });

    return grouped;
  }
}
