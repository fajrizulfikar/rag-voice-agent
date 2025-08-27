import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string; // For text-only uploads

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsUrl({}, { message: 'Source URL must be a valid URL' })
  @IsOptional()
  sourceUrl?: string;
}