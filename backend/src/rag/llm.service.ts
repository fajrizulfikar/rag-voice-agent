import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ConfigurationVariables } from '../config/configuration.schema';

export interface DocumentContext {
  id: string;
  content: string;
  title?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface LLMGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  includeSourceInfo?: boolean;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService<ConfigurationVariables>) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY', { infer: true }),
    });
  }

  async generateAnswer(
    query: string,
    documents: DocumentContext[],
    options: LLMGenerationOptions = {},
  ): Promise<string> {
    try {
      this.logger.debug(`Generating answer for query: "${query.substring(0, 50)}..."`);

      if (documents.length === 0) {
        return this.generateNoContextResponse();
      }

      const contextText = this.buildContext(documents);
      const systemPrompt = this.buildSystemPrompt(options.systemPrompt);
      const userPrompt = this.buildUserPrompt(query, contextText, options.includeSourceInfo);

      const response = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', { infer: true }) || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options.maxTokens || this.configService.get('OPENAI_MAX_TOKENS', { infer: true }),
        temperature: options.temperature || this.configService.get('OPENAI_TEMPERATURE', { infer: true }),
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      const answer = response.choices[0]?.message?.content?.trim();

      if (!answer) {
        this.logger.warn('OpenAI returned empty response');
        return this.generateFallbackResponse();
      }

      this.logger.debug(`Generated answer with ${answer.length} characters`);
      return answer;

    } catch (error) {
      this.logger.error('Error generating answer with OpenAI:', error);
      
      if (error && typeof error === 'object' && 'status' in error) {
        this.logger.error(`OpenAI API Error: ${error.status} - ${error.message}`);
        
        // Handle specific API errors
        if (error.status === 429) {
          return 'I apologize, but I\'m currently experiencing high demand. Please try again in a moment.';
        } else if (error.status === 401) {
          return 'I\'m experiencing authentication issues. Please contact support if this persists.';
        }
      }

      return this.generateFallbackResponse();
    }
  }

  private buildContext(documents: DocumentContext[]): string {
    const contextWindowSize = this.configService.get('RAG_CONTEXT_WINDOW_SIZE', { infer: true }) || 4000;
    const maxDocuments = this.configService.get('RAG_MAX_CONTEXT_DOCUMENTS', { infer: true }) || 5;
    
    // Sort documents by relevance score (highest first)
    const sortedDocuments = documents
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDocuments);

    let context = '';
    let currentLength = 0;

    for (const doc of sortedDocuments) {
      const docTitle = doc.title || `Document ${doc.id}`;
      const docHeader = `[Source: ${docTitle}]\n`;
      const docContent = doc.content.trim() + '\n\n';
      const docText = docHeader + docContent;

      // Check if adding this document would exceed context window
      if (currentLength + docText.length > contextWindowSize) {
        // Try to fit partial content if there's space
        const remainingSpace = contextWindowSize - currentLength - docHeader.length - 50; // Leave some buffer
        if (remainingSpace > 100) {
          const partialContent = doc.content.substring(0, remainingSpace) + '...\n\n';
          context += docHeader + partialContent;
        }
        break;
      }

      context += docText;
      currentLength += docText.length;
    }

    return context.trim();
  }

  private buildSystemPrompt(customPrompt?: string): string {
    const basePrompt = customPrompt || this.configService.get('OPENAI_SYSTEM_PROMPT', { infer: true });
    
    return `${basePrompt}

Instructions:
- Use ONLY the provided context documents to answer questions
- If the context doesn't contain enough information, clearly state that
- Be concise but thorough in your responses
- Maintain a helpful and professional tone
- When referencing specific information, you may mention the source document
- If multiple sources contain relevant information, synthesize them coherently`;
  }

  private buildUserPrompt(query: string, context: string, includeSourceInfo: boolean = false): string {
    let prompt = `Context Documents:\n\n${context}\n\n`;
    prompt += `Question: ${query}\n\n`;
    prompt += `Please provide a helpful answer based on the context documents above.`;
    
    if (includeSourceInfo) {
      prompt += ` If you reference specific information, you may mention which source document it came from.`;
    }

    return prompt;
  }

  private generateNoContextResponse(): string {
    return "I apologize, but I couldn't find any relevant information in the knowledge base to answer your question. Please try rephrasing your query or contact support for assistance with topics not covered in our documentation.";
  }

  private generateFallbackResponse(): string {
    return 'I encountered an issue while generating a response to your question. Please try asking again, or contact support if the problem persists.';
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', { infer: true }) || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });

      return response.choices.length > 0;
    } catch (error) {
      this.logger.error('OpenAI connection validation failed:', error);
      return false;
    }
  }

  getModelInfo(): any {
    try {
      const model = this.configService.get('OPENAI_MODEL', { infer: true });
      return {
        model,
        maxTokens: this.configService.get('OPENAI_MAX_TOKENS', { infer: true }),
        temperature: this.configService.get('OPENAI_TEMPERATURE', { infer: true }),
        contextWindowSize: this.configService.get('RAG_CONTEXT_WINDOW_SIZE', { infer: true }),
        maxContextDocuments: this.configService.get('RAG_MAX_CONTEXT_DOCUMENTS', { infer: true }),
      };
    } catch (error) {
      this.logger.error('Error getting model info:', error);
      return null;
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simple approximation; for production, consider using tiktoken library
    return Math.ceil(text.length / 4);
  }

  async optimizeContextForTokenLimit(
    documents: DocumentContext[],
    maxTokens: number,
  ): Promise<DocumentContext[]> {
    const optimizedDocs: DocumentContext[] = [];
    let totalTokens = 0;

    // Sort by relevance score
    const sortedDocs = documents.sort((a, b) => b.score - a.score);

    for (const doc of sortedDocs) {
      const docTokens = this.estimateTokens(doc.content);
      
      if (totalTokens + docTokens <= maxTokens) {
        optimizedDocs.push(doc);
        totalTokens += docTokens;
      } else {
        // Try to fit a truncated version
        const remainingTokens = maxTokens - totalTokens;
        if (remainingTokens > 50) { // Only if there's meaningful space left
          const maxChars = remainingTokens * 4; // Rough conversion back to characters
          const truncatedDoc: DocumentContext = {
            ...doc,
            content: doc.content.substring(0, maxChars) + '...',
          };
          optimizedDocs.push(truncatedDoc);
        }
        break;
      }
    }

    this.logger.debug(`Optimized context: ${optimizedDocs.length} documents, ~${totalTokens} tokens`);
    return optimizedDocs;
  }
}