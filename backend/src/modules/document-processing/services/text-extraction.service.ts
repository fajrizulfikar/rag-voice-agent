import { Injectable, Logger } from '@nestjs/common';
import { SupportedFileType } from '../interfaces';

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
    // TODO: Implement PDF text extraction using pdf-parse
    // This will be implemented once dependencies are installed
    throw new Error('PDF extraction not yet implemented');
  }

  private async extractFromDocx(file: Buffer): Promise<string> {
    // TODO: Implement DOCX text extraction using mammoth
    // This will be implemented once dependencies are installed
    throw new Error('DOCX extraction not yet implemented');
  }

  private async extractFromTxt(file: Buffer): Promise<string> {
    try {
      return file.toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to extract text from TXT file: ${error.message}`);
    }
  }

  private async extractFromHtml(file: Buffer): Promise<string> {
    // TODO: Implement HTML text extraction using cheerio
    // This will be implemented once dependencies are installed
    throw new Error('HTML extraction not yet implemented');
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
