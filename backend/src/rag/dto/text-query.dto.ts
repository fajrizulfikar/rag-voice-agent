import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class TextQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  context?: string;
}