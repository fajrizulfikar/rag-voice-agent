import { Injectable, Logger } from '@nestjs/common';
import { TextExtractionService } from './text-extraction.service';
import { TextPreprocessingService } from './text-preprocessing.service';
import { TextChunkingService } from './text-chunking.service';
import {
  ProcessingResult,
  ChunkingOptions,
  ProcessingStage,
  SupportedFileType,
} from '../interfaces';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly textExtractionService: TextExtractionService,
    private readonly textPreprocessingService: TextPreprocessingService,
    private readonly textChunkingService: TextChunkingService,
  ) {}

  async processDocument(
    file: Buffer,
    fileName: string,
    options: ChunkingOptions,
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const documentId = this.generateDocumentId(fileName);
    const fileType = this.getFileType(fileName);

    this.logger.log(`Processing document: ${fileName} (${fileType})`);

    const result: ProcessingResult = {
      success: false,
      documentId,
      chunks: [],
      metadata: {
        originalFileName: fileName,
        fileType,
        fileSize: file.length,
        totalChunks: 0,
        totalTokens: 0,
        processingTimeMs: 0,
        extractedTextLength: 0,
      },
      errors: [],
    };

    try {
      // Stage 1: Text Extraction
      const extractedText = await this.textExtractionService.extractText(
        file,
        fileType as SupportedFileType,
      );

      result.metadata.extractedTextLength = extractedText.length;

      // Stage 2: Text Preprocessing
      const preprocessedText =
        await this.textPreprocessingService.preprocess(extractedText);

      // Stage 3: Text Chunking
      result.chunks = await this.textChunkingService.chunkText(
        preprocessedText,
        options,
        documentId,
        fileName,
      );

      result.metadata.totalChunks = result.chunks.length;
      result.metadata.totalTokens = result.chunks.reduce(
        (sum, chunk) => sum + chunk.metadata.tokenCount,
        0,
      );

      result.success = true;
      this.logger.log(
        `Document processed successfully: ${result.chunks.length} chunks created`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing document: ${error.message}`,
        error.stack,
      );
      result.errors?.push({
        stage: ProcessingStage.EXTRACTION,
        message: error.message,
        details: error,
      });
    }

    result.metadata.processingTimeMs = Date.now() - startTime;
    return result;
  }

  private generateDocumentId(fileName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    return `doc_${sanitizedName}_${timestamp}_${random}`;
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }
}
