import { Injectable, Logger } from '@nestjs/common';
import { SupportedFileType } from '../interfaces';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as cheerio from 'cheerio';

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  async extractText(
    file: Buffer,
    fileType: SupportedFileType,
  ): Promise<string> {
    this.logger.log(`Extracting text from ${fileType} file`);

    switch (fileType) {
      case SupportedFileType.PDF:
        return this.extractFromPdf(file);
      case SupportedFileType.DOCX:
        return this.extractFromDocx(file);
      case SupportedFileType.TXT:
        return this.extractFromTxt(file);
      case SupportedFileType.HTML:
        return this.extractFromHtml(file);
      case SupportedFileType.MARKDOWN:
        return this.extractFromMarkdown(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPdf(file: Buffer): Promise<string> {
    try {
      const data = await (pdfParse as any)(file);
      return data.text;
    } catch (error) {
      this.logger.error(`Failed to extract text from PDF: ${error.message}`);
      throw new Error(`Failed to extract text from PDF file: ${error.message}`);
    }
  }

  private async extractFromDocx(file: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: file });
      if (result.messages.length > 0) {
        this.logger.warn(`DOCX extraction warnings: ${result.messages.map(m => m.message).join(', ')}`);
      }
      return result.value;
    } catch (error) {
      this.logger.error(`Failed to extract text from DOCX: ${error.message}`);
      throw new Error(`Failed to extract text from DOCX file: ${error.message}`);
    }
  }

  private async extractFromTxt(file: Buffer): Promise<string> {
    try {
      return file.toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to extract text from TXT file: ${error.message}`);
    }
  }

  private async extractFromHtml(file: Buffer): Promise<string> {
    try {
      const html = file.toString('utf-8');
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Extract text content
      const text = $('body').text() || $.text();
      
      // Clean up whitespace
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      this.logger.error(`Failed to extract text from HTML: ${error.message}`);
      throw new Error(`Failed to extract text from HTML file: ${error.message}`);
    }
  }

  private async extractFromMarkdown(file: Buffer): Promise<string> {
    try {
      // For now, treat markdown as plain text
      // TODO: Consider using a markdown parser to extract clean text
      return file.toString('utf-8');
    } catch (error) {
      throw new Error(
        `Failed to extract text from Markdown file: ${error.message}`,
      );
    }
  }

  isFileTypeSupported(fileType: string): boolean {
    return Object.values(SupportedFileType).includes(
      fileType as SupportedFileType,
    );
  }

  getSupportedFileTypes(): SupportedFileType[] {
    return Object.values(SupportedFileType);
  }
}
