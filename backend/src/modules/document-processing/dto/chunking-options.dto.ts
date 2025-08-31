import { IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ChunkingStrategy } from '../interfaces';

export class ChunkingOptionsDto {
  @IsEnum(ChunkingStrategy)
  strategy: ChunkingStrategy;

  @IsNumber()
  maxChunkSize: number;

  @IsNumber()
  overlapSize: number;

  @IsOptional()
  @IsBoolean()
  preserveFormatting?: boolean;

  @IsOptional()
  @IsBoolean()
  respectSentenceBoundaries?: boolean;
}
