import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TextPreprocessingService {
  private readonly logger = new Logger(TextPreprocessingService.name);

  async preprocess(text: string): Promise<string> {
    this.logger.log('Preprocessing text for chunking');

    let processedText = text;

    // Step 1: Normalize whitespace
    processedText = this.normalizeWhitespace(processedText);

    // Step 2: Remove excessive line breaks
    processedText = this.normalizeLineBreaks(processedText);

    // Step 3: Clean up special characters
    processedText = this.cleanSpecialCharacters(processedText);

    // Step 4: Normalize quotation marks
    processedText = this.normalizeQuotes(processedText);

    // Step 5: Remove empty lines and trim
    processedText = this.removeEmptyLines(processedText);

    this.logger.log(
      `Text preprocessing complete. Original: ${text.length} chars, Processed: ${processedText.length} chars`,
    );

    return processedText;
  }

  private normalizeWhitespace(text: string): string {
    // Replace multiple spaces with single space
    // Replace tabs with spaces
    // Normalize other whitespace characters
    return text
      .replace(/\t/g, ' ')
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u2000-\u200B/g, ' ') // Various Unicode spaces
      .replace(/ +/g, ' '); // Multiple spaces to single space
  }

  private normalizeLineBreaks(text: string): string {
    // Replace various line break combinations with consistent \n
    return text
      .replace(/\r\n/g, '\n') // Windows line endings
      .replace(/\r/g, '\n') // Mac line endings
      .replace(/\n{3,}/g, '\n\n'); // Replace 3+ consecutive newlines with 2
  }

  private cleanSpecialCharacters(text: string): string {
    // Remove or replace problematic characters that might interfere with processing
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width characters
      .replace(/[^\x00-\x7F\u0080-\uFFFF]/g, '') // Remove invalid Unicode
      .replace(/\u201C|\u201D/g, '"') // Smart quotes to regular quotes
      .replace(/\u2018|\u2019/g, "'") // Smart apostrophes to regular apostrophes
      .replace(/\u2013|\u2014/g, '-') // En dash and em dash to hyphen
      .replace(/\u2026/g, '...'); // Ellipsis to three dots
  }

  private normalizeQuotes(text: string): string {
    // Standardize quotation marks
    return text
      .replace(/[""]/g, '"') // Various double quotes to standard
      .replace(/['']/g, "'"); // Various single quotes to standard
  }

  private removeEmptyLines(text: string): string {
    // Remove empty lines and trim each line
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .trim();
  }

  // Additional preprocessing methods for specific use cases

  async preprocessForEmbedding(text: string): Promise<string> {
    // More aggressive preprocessing for embedding generation
    let processedText = await this.preprocess(text);

    // Remove excessive punctuation
    processedText = this.cleanPunctuation(processedText);

    // Normalize case (optional - depends on embedding model requirements)
    // processedText = processedText.toLowerCase();

    return processedText;
  }

  private cleanPunctuation(text: string): string {
    // Remove excessive punctuation while preserving sentence structure
    return text
      .replace(/[.]{2,}/g, '.') // Multiple periods to single period
      .replace(/[!]{2,}/g, '!') // Multiple exclamations to single
      .replace(/[?]{2,}/g, '?') // Multiple questions to single
      .replace(/[,]{2,}/g, ',') // Multiple commas to single
      .replace(/[;]{2,}/g, ';') // Multiple semicolons to single
      .replace(/[:]{2,}/g, ':') // Multiple colons to single
      .replace(/[-]{2,}/g, '-'); // Multiple hyphens to single
  }

  // Method to validate text after preprocessing
  validatePreprocessedText(text: string): boolean {
    if (!text || text.trim().length === 0) {
      this.logger.warn('Preprocessed text is empty');
      return false;
    }

    if (text.length < 10) {
      this.logger.warn('Preprocessed text is too short');
      return false;
    }

    return true;
  }

  // Method to get preprocessing statistics
  getPreprocessingStats(originalText: string, processedText: string) {
    return {
      originalLength: originalText.length,
      processedLength: processedText.length,
      reductionPercentage:
        ((originalText.length - processedText.length) / originalText.length) *
        100,
      originalLines: originalText.split('\n').length,
      processedLines: processedText.split('\n').length,
    };
  }
}
