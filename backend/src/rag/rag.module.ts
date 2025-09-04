import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { VectorService } from './vector.service';
import { EmbeddingService } from './embedding.service';
import { LLMService } from './llm.service';
import { QueryLog } from '../entities';
import { DocumentsModule } from '../documents';

@Module({
  imports: [TypeOrmModule.forFeature([QueryLog]), DocumentsModule],
  controllers: [RagController],
  providers: [RagService, VectorService, EmbeddingService, LLMService],
  exports: [RagService, VectorService, EmbeddingService, LLMService],
})
export class RagModule {}
