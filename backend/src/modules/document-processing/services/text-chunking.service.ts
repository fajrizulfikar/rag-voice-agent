import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentChunk,
  ChunkingOptions,
  ChunkingStrategy,
} from '../interfaces';
import { encoding_for_model } from 'tiktoken';

@Injectable()
export class TextChunkingService {
  private readonly logger = new Logger(TextChunkingService.name);
  private readonly tokenizer = encoding_for_model('text-embedding-ada-002');

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
    const chunks: DocumentChunk[] = [];
    const { maxChunkSize, overlapSize } = options;
    const maxTokens = Math.floor(maxChunkSize / 4); // Rough estimate: 4 chars per token
    const overlapTokens = Math.floor(overlapSize / 4);

    this.logger.debug(
      `Token-aware chunking: max ${maxTokens} tokens, overlap ${overlapTokens} tokens`,
    );

    // Split text into sentences for better chunk boundaries
    const sentences = this.splitIntoSentences(text);
    let currentChunk = '';
    let currentTokenCount = 0;
    let startPosition = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);

      // If adding this sentence would exceed max tokens, finalize current chunk
      if (currentTokenCount + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(
          this.createChunk(
            currentChunk.trim(),
            chunks.length,
            documentId,
            sourceFile,
            options.strategy,
            startPosition,
            startPosition + currentChunk.length,
          ),
        );

        // Start new chunk with overlap from previous chunk if specified
        if (overlapTokens > 0 && currentChunk) {
          const overlapText = this.getLastNTokensAsText(
            currentChunk,
            overlapTokens,
          );
          currentChunk = overlapText + ' ' + sentence;
          currentTokenCount = this.countTokens(currentChunk);
        } else {
          currentChunk = sentence;
          currentTokenCount = sentenceTokens;
        }

        startPosition += currentChunk.length - sentence.length;
      } else {
        // Add sentence to current chunk
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokenCount += sentenceTokens;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(
          currentChunk.trim(),
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
    return this.countTokens(text);
  }

  private countTokens(text: string): number {
    try {
      return this.tokenizer.encode(text).length;
    } catch (error: any) {
      this.logger.warn(`Failed to count tokens, using estimation: ${error}`);
      // Fallback to character-based estimation
      return Math.ceil(text.length / 4);
    }
  }

  private splitIntoSentences(text: string): string[] {
    // More sophisticated sentence splitting
    return text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  private getLastNTokensAsText(text: string, n: number): string {
    try {
      const tokens = this.tokenizer.encode(text);
      const lastNTokens = tokens.slice(-n);
      const decoded = this.tokenizer.decode(lastNTokens);
      return typeof decoded === 'string'
        ? decoded
        : new TextDecoder().decode(decoded);
    } catch (error: any) {
      this.logger.warn(
        `Failed to extract last N tokens, using character fallback: ${error}`,
      );
      // Fallback to character-based estimation
      const estimatedChars = n * 4;
      return text.slice(-estimatedChars);
    }
  }
}
