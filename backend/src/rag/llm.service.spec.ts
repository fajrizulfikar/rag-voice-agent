import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMService, DocumentContext } from './llm.service';

// Mock OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
    APIError: class MockAPIError extends Error {
      constructor(message: string, request: any, status: number, headers: any) {
        super(message);
        this.status = status;
      }
      status: number;
    },
  };
});

describe('LLMService', () => {
  let service: LLMService;
  let mockOpenAICreate: jest.Mock;

  const mockConfigValues = {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-3.5-turbo',
    OPENAI_MAX_TOKENS: 1000,
    OPENAI_TEMPERATURE: 0.7,
    OPENAI_SYSTEM_PROMPT: 'You are a helpful AI assistant.',
    RAG_CONTEXT_WINDOW_SIZE: 4000,
    RAG_MAX_CONTEXT_DOCUMENTS: 5,
  };

  beforeEach(async () => {
    // Get the mocked OpenAI constructor
    const OpenAI = require('openai').default;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfigValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    
    // Get reference to the mocked create method
    const mockInstance = OpenAI.mock.results[OpenAI.mock.results.length - 1].value;
    mockOpenAICreate = mockInstance.chat.completions.create;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnswer', () => {
    const mockDocuments: DocumentContext[] = [
      {
        id: 'doc1',
        content: 'This is the first document about cats.',
        title: 'Cat Facts',
        score: 0.9,
        metadata: { category: 'animals' },
      },
      {
        id: 'doc2',
        content: 'This is the second document about dogs.',
        title: 'Dog Facts',
        score: 0.8,
        metadata: { category: 'animals' },
      },
    ];

    it('should generate an answer using OpenAI with provided documents', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Based on the provided documents, cats are fascinating animals.',
            },
          },
        ],
      };

      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await service.generateAnswer('Tell me about cats', mockDocuments);

      expect(result).toBe('Based on the provided documents, cats are fascinating animals.');
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('You are a helpful AI assistant.'),
          },
          {
            role: 'user',
            content: expect.stringContaining('Tell me about cats'),
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0,
        frequency_penalty: 0,
      });
    });

    it('should handle empty documents array', async () => {
      const result = await service.generateAnswer('Tell me about cats', []);

      expect(result).toContain("couldn't find any relevant information");
      expect(mockOpenAICreate).not.toHaveBeenCalled();
    });

    it('should handle OpenAI rate limit errors gracefully', async () => {
      const OpenAI = require('openai');
      const apiError = new OpenAI.APIError('Rate limit exceeded', null, 429, null);
      mockOpenAICreate.mockRejectedValue(apiError);

      const result = await service.generateAnswer('Tell me about cats', mockDocuments);

      expect(result).toContain('experiencing high demand');
    });

    it('should handle authentication errors', async () => {
      const OpenAI = require('openai');
      const authError = new OpenAI.APIError('Invalid API key', null, 401, null);
      mockOpenAICreate.mockRejectedValue(authError);

      const result = await service.generateAnswer('Tell me about cats', mockDocuments);

      expect(result).toContain('authentication issues');
    });

    it('should handle empty response from OpenAI', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await service.generateAnswer('Tell me about cats', mockDocuments);

      expect(result).toContain('encountered an issue');
    });
  });

  describe('validateConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hello' } }],
      };

      mockOpenAICreate.mockResolvedValue(mockResponse);

      const result = await service.validateConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockOpenAICreate.mockRejectedValue(new Error('Connection failed'));

      const result = await service.validateConnection();

      expect(result).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('should return model configuration info', () => {
      const result = service.getModelInfo();

      expect(result).toEqual({
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        contextWindowSize: 4000,
        maxContextDocuments: 5,
      });
    });
  });

  describe('estimateTokens', () => {
    it('should estimate token count correctly', () => {
      const text = 'This is a test string with about twenty characters.';
      const result = service.estimateTokens(text);

      // Rough estimation: 1 token ≈ 4 characters
      const expectedTokens = Math.ceil(text.length / 4);
      expect(result).toBe(expectedTokens);
    });
  });

  describe('optimizeContextForTokenLimit', () => {
    it('should optimize documents to fit within token limit', async () => {
      const documents: DocumentContext[] = [
        {
          id: 'doc1',
          content: 'Short content',
          score: 0.9,
        },
        {
          id: 'doc2',
          content: 'Another short content',
          score: 0.8,
        },
        {
          id: 'doc3',
          content: 'This is a very long document with lots of content that might exceed the token limit',
          score: 0.7,
        },
      ];

      const result = await service.optimizeContextForTokenLimit(documents, 20);

      expect(result.length).toBeLessThanOrEqual(documents.length);
      // Should prioritize higher scoring documents
      if (result.length > 1) {
        expect(result[0]?.score).toBeGreaterThanOrEqual(result[1]?.score || 0);
      }
    });

    it('should include all documents if they fit within limit', async () => {
      const documents: DocumentContext[] = [
        {
          id: 'doc1',
          content: 'Short',
          score: 0.9,
        },
        {
          id: 'doc2',
          content: 'Also short',
          score: 0.8,
        },
      ];

      const result = await service.optimizeContextForTokenLimit(documents, 1000);

      expect(result).toHaveLength(2);
      expect(result).toEqual(documents.sort((a, b) => b.score - a.score));
    });
  });
});