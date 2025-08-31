import { DocumentChunk } from './document-chunk.interface';

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunks: DocumentChunk[];
  metadata: {
    originalFileName: string;
    fileType: string;
    fileSize: number;
    totalChunks: number;
    totalTokens: number;
    processingTimeMs: number;
    extractedTextLength: number;
  };
  errors?: ProcessingError[];
}

export interface ProcessingError {
  stage: ProcessingStage;
  message: string;
  details?: any;
}

export enum ProcessingStage {
  EXTRACTION = 'extraction',
  PREPROCESSING = 'preprocessing',
  CHUNKING = 'chunking',
  VALIDATION = 'validation',
}

export enum SupportedFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  HTML = 'html',
  MARKDOWN = 'markdown',
}
