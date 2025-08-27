import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryLog } from '../entities';
import { VectorService } from './vector.service';
import { EmbeddingService } from './embedding.service';
import { TextQueryDto, VoiceQueryDto, QueryResponse } from './dto';

@Injectable()
export class RagService {
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
      userId,
      queryType: 'text',
    });

    try {
      // Generate embedding for the query
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);

      // Search for similar documents in vector database
      const similarDocuments =
        await this.vectorService.searchSimilarDocuments(queryEmbedding);

      // Generate answer using retrieved context (placeholder for now)
      const answer = await this.generateAnswer(query, similarDocuments);

      // Update query log with results
      await this.updateQueryLog(queryLog.id, {
        answer,
        documentsFound: similarDocuments.length,
        responseTime: Date.now() - queryLog.createdAt.getTime(),
      });

      return {
        answer,
        sources: similarDocuments,
        queryId: queryLog.id,
      };
    } catch (error) {
      // Update query log with error
      await this.updateQueryLog(queryLog.id, {
        error: error.message,
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
}
