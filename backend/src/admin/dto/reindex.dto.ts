import { IsBoolean, IsOptional, IsArray, IsUUID } from 'class-validator';

export class ReindexDto {
  @IsBoolean()
  @IsOptional()
  fullReindex?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  documentIds?: string[];
}