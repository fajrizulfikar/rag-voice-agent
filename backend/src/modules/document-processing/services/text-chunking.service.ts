import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentChunk,
  ChunkingOptions,
  ChunkingStrategy,
} from '../interfaces';

@Injectable()
export class TextChunkingService {
  private readonly logger = new Logger(TextChunkingService.name);

  async chunkText(
    text: string,
    options: ChunkingOptions,
    documentId: string,
    sourceFile: string,
  ): Promise<DocumentChunk[]> {
    this.logger.log(
      `Chunking text using ${options.strategy} strategy, max size: ${options.maxChunkSize}`,
    );

    switch (options.strategy) {
      case ChunkingStrategy.FIXED_SIZE:
        return this.fixedSizeChunking(text, options, documentId, sourceFile);
      case ChunkingStrategy.SENTENCE_BOUNDARY:
        return this.sentenceBoundaryChunking(
          text,
          options,
          documentId,
          sourceFile,
        );
      case ChunkingStrategy.SEMANTIC:
        return this.semanticChunking(text, options, documentId, sourceFile);
      case ChunkingStrategy.TOKEN_AWARE:
        return this.tokenAwareChunking(text, options, documentId, sourceFile);
      default:
        throw new Error(`Unsupported chunking strategy: ${options.strategy}`);
    }
  }

  private fixedSizeChunking(
    text: string,
    options: ChunkingOptions,
    documentId: string,
    sourceFile: string,
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { maxChunkSize, overlapSize } = options;
    const step = maxChunkSize - overlapSize;

    for (let i = 0; i < text.length; i += step) {
      const end = Math.min(i + maxChunkSize, text.length);
      const chunkContent = text.slice(i, end);

      if (chunkContent.trim().length === 0) continue;

      chunks.push(
        this.createChunk(
          chunkContent,
          chunks.length,
          documentId,
          sourceFile,
          options.strategy,
          i,
          end,
        ),
      );
    }

    return this.updateTotalChunks(chunks);
  }

  private sentenceBoundaryChunking(
    text: string,
    options: ChunkingOptions,
    documentId: string,
    sourceFile: string,
  ): DocumentChunk[] {
    // TODO: Implement proper sentence boundary detection
    // For now, use simple sentence splitting
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let startPosition = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length === 0) continue;

      const potentialChunk =
        currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

      if (potentialChunk.length <= options.maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(
            this.createChunk(
              currentChunk,
              chunks.length,
              documentId,
              sourceFile,
              options.strategy,
              startPosition,
              startPosition + currentChunk.length,
            ),
          );
          startPosition += currentChunk.length;
        }
        currentChunk = trimmedSentence;
      }
    }

    if (currentChunk) {
      chunks.push(
        this.createChunk(
          currentChunk,
          chunks.length,
          documentId,
          sourceFile,
          options.strategy,
          startPosition,
          startPosition + currentChunk.length,
        ),
      );
    }

    return this.updateTotalChunks(chunks);
  }

  private semanticChunking(
    text: string,
    options: ChunkingOptions,
    documentId: string,
    sourceFile: string,
  ): DocumentChunk[] {
    // TODO: Implement semantic chunking using embeddings similarity
    // For now, fallback to sentence boundary chunking
    this.logger.warn(
      'Semantic chunking not yet implemented, falling back to sentence boundary',
    );
    return this.sentenceBoundaryChunking(text, options, documentId, sourceFile);
  }

  private tokenAwareChunking(
    text: string,
    options: ChunkingOptions,
    documentId: string,
    sourceFile: string,
  ): DocumentChunk[] {
    // TODO: Implement token-aware chunking using tiktoken
    // For now, fallback to fixed size chunking
    this.logger.warn(
      'Token-aware chunking not yet implemented, falling back to fixed size',
    );
    return this.fixedSizeChunking(text, options, documentId, sourceFile);
  }

  private createChunk(
    content: string,
    index: number,
    documentId: string,
    sourceFile: string,
    strategy: ChunkingStrategy,
    startPosition?: number,
    endPosition?: number,
  ): DocumentChunk {
    return {
      id: `${documentId}_chunk_${index}`,
      content: content.trim(),
      metadata: {
        sourceFile,
        chunkIndex: index,
        totalChunks: 0, // Will be updated later
        startPosition,
        endPosition,
        tokenCount: this.estimateTokenCount(content),
        chunkingStrategy: strategy,
      },
    };
  }

  private updateTotalChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    const totalChunks = chunks.length;
    return chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        totalChunks,
      },
    }));
  }

  private estimateTokenCount(text: string): number {
    // Simple token estimation: roughly 4 characters per token
    // TODO: Use tiktoken for accurate token counting
    return Math.ceil(text.length / 4);
  }
}
