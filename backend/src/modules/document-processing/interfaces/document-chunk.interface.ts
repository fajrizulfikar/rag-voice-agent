export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    sourceFile: string;
    chunkIndex: number;
    totalChunks: number;
    startPosition?: number;
    endPosition?: number;
    tokenCount: number;
    chunkingStrategy: ChunkingStrategy;
  };
}

export enum ChunkingStrategy {
  FIXED_SIZE = 'fixed_size',
  SENTENCE_BOUNDARY = 'sentence_boundary',
  SEMANTIC = 'semantic',
  TOKEN_AWARE = 'token_aware',
}

export interface ChunkingOptions {
  strategy: ChunkingStrategy;
  maxChunkSize: number;
  overlapSize: number;
  preserveFormatting?: boolean;
  respectSentenceBoundaries?: boolean;
}
