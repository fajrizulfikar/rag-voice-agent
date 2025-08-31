import { Module } from '@nestjs/common';
import { DocumentProcessingService } from './services/document-processing.service';
import { TextExtractionService } from './services/text-extraction.service';
import { TextChunkingService } from './services/text-chunking.service';
import { TextPreprocessingService } from './services/text-preprocessing.service';

@Module({
  providers: [
    DocumentProcessingService,
    TextExtractionService,
    TextChunkingService,
    TextPreprocessingService,
  ],
  exports: [
    DocumentProcessingService,
    TextExtractionService,
    TextChunkingService,
    TextPreprocessingService,
  ],
})
export class DocumentProcessingModule {}
