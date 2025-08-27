import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  private readonly ALLOWED_MIME_TYPES = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/json',
  ];

  private readonly MAX_FILE_SIZE_MB = 10;

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`File size exceeds ${this.MAX_FILE_SIZE_MB}MB limit`);
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not supported. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }

  generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  extractTextFromFile(file: Express.Multer.File): string {
    this.validateFile(file);

    switch (file.mimetype) {
      case 'text/plain':
      case 'text/markdown':
      case 'text/csv':
      case 'application/json':
        return file.buffer.toString('utf-8');
      
      case 'application/pdf':
        // TODO: Implement PDF text extraction using pdf-parse library
        return this.extractPdfText(file.buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // TODO: Implement DOCX text extraction using mammoth library
        return this.extractDocxText(file.buffer);
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        // TODO: Implement XLSX text extraction using xlsx library
        return this.extractXlsxText(file.buffer);
      
      default:
        throw new BadRequestException(`Text extraction not implemented for ${file.mimetype}`);
    }
  }

  private extractPdfText(buffer: Buffer): string {
    // Placeholder implementation - in real application, use pdf-parse library:
    // const pdf = require('pdf-parse');
    // return pdf(buffer).then(data => data.text);
    
    this.logger.warn('PDF text extraction not implemented - returning placeholder');
    return `[PDF Content - Text extraction will be implemented in Stage 2]
    This is a placeholder for PDF content extraction.
    The file has been uploaded and can be processed once the pdf-parse library is integrated.`;
  }

  private extractDocxText(buffer: Buffer): string {
    // Placeholder implementation - in real application, use mammoth library:
    // const mammoth = require('mammoth');
    // return mammoth.extractRawText({buffer}).then(result => result.value);
    
    this.logger.warn('DOCX text extraction not implemented - returning placeholder');
    return `[DOCX Content - Text extraction will be implemented in Stage 2]
    This is a placeholder for DOCX content extraction.
    The file has been uploaded and can be processed once the mammoth library is integrated.`;
  }

  private extractXlsxText(buffer: Buffer): string {
    // Placeholder implementation - in real application, use xlsx library:
    // const XLSX = require('xlsx');
    // const workbook = XLSX.read(buffer, {type: 'buffer'});
    // return XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    
    this.logger.warn('XLSX text extraction not implemented - returning placeholder');
    return `[XLSX Content - Text extraction will be implemented in Stage 2]
    This is a placeholder for Excel content extraction.
    The file has been uploaded and can be processed once the xlsx library is integrated.`;
  }

  getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = this.getFileExtension(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    
    return `${nameWithoutExt}_${timestamp}_${random}${ext}`;
  }

  chunkText(text: string, maxChunkSize: number = 1000, overlapSize: number = 200): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + maxChunkSize, text.length);
      let chunk = text.slice(startIndex, endIndex);

      // If this isn't the last chunk, try to end at a sentence boundary
      if (endIndex < text.length) {
        const lastSentenceEnd = Math.max(
          chunk.lastIndexOf('.'),
          chunk.lastIndexOf('!'),
          chunk.lastIndexOf('?')
        );

        if (lastSentenceEnd > chunk.length * 0.5) {
          chunk = chunk.slice(0, lastSentenceEnd + 1);
        }
      }

      chunks.push(chunk.trim());
      startIndex = startIndex + chunk.length - overlapSize;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}