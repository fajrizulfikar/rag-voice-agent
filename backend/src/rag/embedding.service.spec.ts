import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'openai.apiKey':
          return 'test-api-key';
        case 'openai.embeddingModel':
          return 'text-embedding-ada-002';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when OpenAI API key is not configured', () => {
      const mockConfigWithoutKey = {
        get: jest.fn(() => undefined),
      };

      expect(() => {
        new EmbeddingService(mockConfigWithoutKey as any);
      }).toThrow('OpenAI API key not configured');
    });
  });

  describe('generateEmbedding', () => {
    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(
        'Text cannot be empty for embedding generation',
      );
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(service.generateEmbedding('   ')).rejects.toThrow(
        'Text cannot be empty for embedding generation',
      );
    });

    // Note: Real API tests would require actual OpenAI API key
    // Integration tests should be added when API key is available
  });

  describe('generateEmbeddings', () => {
    it('should return empty array for empty input', async () => {
      const result = await service.generateEmbeddings([]);
      expect(result).toEqual([]);
    });

    it('should throw error when no valid texts provided', async () => {
      await expect(service.generateEmbeddings(['', '   '])).rejects.toThrow(
        'No valid texts provided for embedding generation',
      );
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate cosine similarity correctly', async () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const similarity = await service.calculateSimilarity(
        embedding1,
        embedding2,
      );
      expect(similarity).toBe(0);
    });

    it('should return 1 for identical embeddings', async () => {
      const embedding = [1, 2, 3];
      const similarity = await service.calculateSimilarity(embedding, embedding);
      expect(similarity).toBeCloseTo(1, 10);
    });

    it('should throw error for different dimension embeddings', async () => {
      const embedding1 = [1, 0];
      const embedding2 = [0, 1, 0];
      await expect(
        service.calculateSimilarity(embedding1, embedding2),
      ).rejects.toThrow('Embedding dimensions must match');
    });

    it('should return 0 for zero vector', async () => {
      const embedding1 = [0, 0, 0];
      const embedding2 = [1, 2, 3];
      const similarity = await service.calculateSimilarity(
        embedding1,
        embedding2,
      );
      expect(similarity).toBe(0);
    });
  });
});