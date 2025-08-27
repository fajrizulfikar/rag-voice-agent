import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsUrl({}, { message: 'Source URL must be a valid URL' })
  @IsOptional()
  sourceUrl?: string;

  @IsString()
  @IsOptional()
  metadata?: string;
}
