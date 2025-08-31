import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ChunkingStrategy } from '../interfaces';

export class ProcessDocumentDto {
  @IsEnum(ChunkingStrategy)
  strategy: ChunkingStrategy;

  @IsNumber()
  @Min(100)
  @Max(8000)
  maxChunkSize: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  overlapSize: number;

  @IsOptional()
  @IsBoolean()
  preserveFormatting?: boolean;

  @IsOptional()
  @IsBoolean()
  respectSentenceBoundaries?: boolean;
}
