import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
  validateTextQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new BadRequestException('Query must be a non-empty string');
    }

    if (query.length < 3) {
      throw new BadRequestException('Query must be at least 3 characters long');
    }

    if (query.length > 1000) {
      throw new BadRequestException(
        'Query must be less than 1000 characters long',
      );
    }
  }

  validateAudioData(audioData: string): void {
    if (!audioData || typeof audioData !== 'string') {
      throw new BadRequestException(
        'Audio data must be a base64 encoded string',
      );
    }

    // Basic base64 validation
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(audioData)) {
      throw new BadRequestException('Audio data must be valid base64');
    }
  }

  validateDocumentContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new BadRequestException(
        'Document content must be a non-empty string',
      );
    }

    if (content.length < 10) {
      throw new BadRequestException(
        'Document content must be at least 10 characters long',
      );
    }

    if (content.length > 100000) {
      throw new BadRequestException(
        'Document content must be less than 100,000 characters long',
      );
    }
  }

  validateFileType(mimeType: string, allowedTypes: string[]): void {
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  validateFileSize(size: number, maxSizeInMB: number): void {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (size > maxSizeInBytes) {
      throw new BadRequestException(
        `File size ${size} bytes exceeds maximum allowed size of ${maxSizeInMB}MB`,
      );
    }
  }

  sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove potentially harmful characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
