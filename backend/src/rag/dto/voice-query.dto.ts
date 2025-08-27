import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class VoiceQueryDto {
  @IsString()
  @IsNotEmpty()
  audioData: string; // Base64 encoded audio data

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  audioFormat?: string; // e.g., 'wav', 'mp3', 'flac'

  @IsString()
  @IsOptional()
  languageCode?: string; // e.g., 'en-US', 'es-ES'
}
