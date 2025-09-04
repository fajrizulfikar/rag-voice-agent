import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { VectorService } from './vector.service';

// Mock QdrantClient to avoid actual API calls in tests
const mockQdrantClient = {
  collectionExists: jest.fn(),
  createCollection: jest.fn(),
  deleteCollection: jest.fn(),
  getCollection: jest.fn(),
  getCollections: jest.fn(),
  search: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  retrieve: jest.fn(),
  scroll: jest.fn(),
  createSnapshot: jest.fn(),
  updateCollection: jest.fn(),
};

// Mock the Qdrant client constructor
jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => mockQdrantClient),
}));

describe('VectorService', () => {
  let service: VectorService;
  let configService: ConfigService;
  let logger: Logger;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'vectorDb.url':
          return 'http://localhost:6333';
        case 'vectorDb.apiKey':
          return undefined;
        case 'vectorDb.collectionName':
          return 'test_collection';
        case 'vectorDb.vectorSize':
          return 1536;
        case 'vectorDb.distanceMetric':
          return 'Cosine';
        case 'vectorDb.maxRetries':
          return 3;
        case 'vectorDb.retryDelay':
          return 1000;
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VectorService>(VectorService);
    configService = module.get<ConfigService>(ConfigService);
    logger = new Logger(VectorService.name);

    // Mock successful collection check for onModuleInit
    mockQdrantClient.collectionExists.mockResolvedValue(true);
  });

  describe('Constructor and Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with correct configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('vectorDb.url');
      expect(configService.get).toHaveBeenCalledWith('vectorDb.collectionName');
    });

    it('should handle module initialization successfully', async () => {
      mockQdrantClient.collectionExists.mockResolvedValue(true);

      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(mockQdrantClient.collectionExists).toHaveBeenCalledWith(
        'test_collection',
      );
    });

    it('should create collection if it does not exist', async () => {
      mockQdrantClient.collectionExists.mockResolvedValue(false);
      mockQdrantClient.createCollection.mockResolvedValue({ status: 'ok' });

      await service.onModuleInit();

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        'test_collection',
        {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
          optimizers_config: expect.any(Object),
          wal_config: expect.any(Object),
        },
      );
    });

    it('should throw error if initialization fails', async () => {
      mockQdrantClient.collectionExists.mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('Basic Vector Operations', () => {
    const testEmbedding = new Array(1536).fill(0.1);
    const testDocumentId = 'test-doc-1';
    const testMetadata = { title: 'Test Document', category: 'test' };

    it('should search for similar documents', async () => {
      const mockSearchResults = [
        { id: 'doc1', score: 0.95, payload: { title: 'Document 1' } },
        { id: 'doc2', score: 0.85, payload: { title: 'Document 2' } },
      ];
      mockQdrantClient.search.mockResolvedValue(mockSearchResults);

      const results = await service.searchSimilarDocuments(testEmbedding, 5);

      expect(mockQdrantClient.search).toHaveBeenCalledWith('test_collection', {
        vector: testEmbedding,
        limit: 5,
        with_payload: true,
        with_vector: false,
      });
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'doc1',
        score: 0.95,
        title: 'Document 1',
      });
    });

    it('should store a document', async () => {
      mockQdrantClient.upsert.mockResolvedValue({ status: 'completed' });

      await service.storeDocument(testDocumentId, testEmbedding, testMetadata);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith('test_collection', {
        points: [
          {
            id: testDocumentId,
            vector: testEmbedding,
            payload: testMetadata,
          },
        ],
      });
    });

    it('should update a document', async () => {
      const updatedMetadata = { ...testMetadata, updated: true };
      mockQdrantClient.upsert.mockResolvedValue({ status: 'completed' });

      await service.updateDocument(
        testDocumentId,
        testEmbedding,
        updatedMetadata,
      );

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith('test_collection', {
        points: [
          {
            id: testDocumentId,
            vector: testEmbedding,
            payload: updatedMetadata,
          },
        ],
      });
    });

    it('should delete a document', async () => {
      mockQdrantClient.delete.mockResolvedValue({ status: 'completed' });

      await service.deleteDocument(testDocumentId);

      expect(mockQdrantClient.delete).toHaveBeenCalledWith('test_collection', {
        points: [testDocumentId],
      });
    });
  });

  describe('Enhanced Vector Operations', () => {
    const testEmbedding = new Array(1536).fill(0.1);
    const testDocument = {
      id: 'test-doc-enhanced',
      content: 'This is a test document content',
      metadata: { category: 'test', priority: 'high' },
      embedding: testEmbedding,
    };

    it('should perform advanced search with options', async () => {
      const mockSearchResults = [
        {
          id: 'doc1',
          score: 0.95,
          payload: {
            content: 'Document 1 content',
            metadata: { category: 'test' },
          },
        },
      ];
      mockQdrantClient.search.mockResolvedValue(mockSearchResults);

      const searchOptions = {
        limit: 3,
        scoreThreshold: 0.8,
        filter: { must: [{ key: 'category', match: { value: 'test' } }] },
      };

      const results = await service.searchSimilarDocumentsAdvanced(
        testEmbedding,
        searchOptions,
      );

      expect(mockQdrantClient.search).toHaveBeenCalledWith('test_collection', {
        vector: testEmbedding,
        limit: 3,
        offset: 0,
        with_payload: true,
        with_vector: false,
        filter: searchOptions.filter,
        score_threshold: 0.8,
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'doc1',
        score: 0.95,
        content: 'Document 1 content',
        metadata: { category: 'test' },
      });
    });

    it('should store enhanced document', async () => {
      mockQdrantClient.upsert.mockResolvedValue({ status: 'completed' });

      await service.storeDocumentEnhanced(testDocument);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith('test_collection', {
        points: [
          {
            id: testDocument.id,
            vector: testDocument.embedding,
            payload: expect.objectContaining({
              content: testDocument.content,
              metadata: testDocument.metadata,
              timestamp: expect.any(String),
            }),
          },
        ],
      });
    });

    it('should throw error for enhanced document without embedding', async () => {
      const documentWithoutEmbedding = { ...testDocument };
      delete documentWithoutEmbedding.embedding;

      await expect(
        service.storeDocumentEnhanced(documentWithoutEmbedding),
      ).rejects.toThrow('Document must have an embedding vector');
    });
  });

  describe('Batch Operations', () => {
    const testEmbedding = new Array(1536).fill(0.1);
    const testDocuments = [
      {
        id: 'doc1',
        content: 'Document 1 content',
        metadata: { category: 'batch1' },
        embedding: testEmbedding,
      },
      {
        id: 'doc2',
        content: 'Document 2 content',
        metadata: { category: 'batch2' },
        embedding: testEmbedding,
      },
    ];

    it('should store documents in batch', async () => {
      mockQdrantClient.upsert.mockResolvedValue({ status: 'completed' });

      await service.storeDocumentsBatch(testDocuments);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith('test_collection', {
        points: expect.arrayContaining([
          expect.objectContaining({
            id: 'doc1',
            vector: testEmbedding,
            payload: expect.objectContaining({
              content: 'Document 1 content',
              metadata: { category: 'batch1' },
            }),
          }),
          expect.objectContaining({
            id: 'doc2',
            vector: testEmbedding,
            payload: expect.objectContaining({
              content: 'Document 2 content',
              metadata: { category: 'batch2' },
            }),
          }),
        ]),
      });
    });

    it('should handle empty batch gracefully', async () => {
      await expect(service.storeDocumentsBatch([])).resolves.not.toThrow();
      expect(mockQdrantClient.upsert).not.toHaveBeenCalled();
    });

    it('should throw error for batch with missing embeddings', async () => {
      const documentsWithoutEmbedding = testDocuments.map((doc) => {
        const { embedding, ...docWithoutEmbedding } = doc;
        return docWithoutEmbedding;
      });

      await expect(
        service.storeDocumentsBatch(documentsWithoutEmbedding as any),
      ).rejects.toThrow('2 documents missing embeddings');
    });

    it('should delete documents in batch', async () => {
      const documentIds = ['doc1', 'doc2', 'doc3'];
      mockQdrantClient.delete.mockResolvedValue({ status: 'completed' });

      await service.deleteDocumentsBatch(documentIds);

      expect(mockQdrantClient.delete).toHaveBeenCalledWith('test_collection', {
        points: documentIds,
      });
    });
  });

  describe('Collection Management', () => {
    it('should get collection information', async () => {
      const mockCollectionInfo = {
        vectors_count: 1000,
        indexed_vectors_count: 950,
        payload_schema: { category: { data_type: 'keyword' } },
        status: 'green',
      };
      mockQdrantClient.getCollection.mockResolvedValue(mockCollectionInfo);

      const info = await service.getCollectionInfo();

      expect(info).toEqual({
        name: 'test_collection',
        vectorsCount: 1000,
        indexedVectorsCount: 950,
        payloadSchema: { category: { data_type: 'keyword' } },
        status: 'green',
      });
    });

    it('should count documents', async () => {
      mockQdrantClient.count.mockResolvedValue({ count: 500 });

      const count = await service.countDocuments();

      expect(count).toBe(500);
      expect(mockQdrantClient.count).toHaveBeenCalledWith('test_collection', {
        filter: undefined,
        exact: true,
      });
    });

    it('should count documents with filter', async () => {
      const filter = { must: [{ key: 'category', match: { value: 'test' } }] };
      mockQdrantClient.count.mockResolvedValue({ count: 100 });

      const count = await service.countDocuments(filter);

      expect(count).toBe(100);
      expect(mockQdrantClient.count).toHaveBeenCalledWith('test_collection', {
        filter,
        exact: true,
      });
    });

    it('should retrieve a single document', async () => {
      const mockDocument = {
        id: 'doc1',
        payload: {
          content: 'Document content',
          metadata: { category: 'test' },
        },
      };
      mockQdrantClient.retrieve.mockResolvedValue([mockDocument]);

      const document = await service.getDocument('doc1');

      expect(document).toEqual({
        id: 'doc1',
        score: 1.0,
        content: 'Document content',
        metadata: { category: 'test' },
      });
    });

    it('should return null for non-existent document', async () => {
      mockQdrantClient.retrieve.mockResolvedValue([]);

      const document = await service.getDocument('non-existent');

      expect(document).toBeNull();
    });

    it('should create collection snapshot', async () => {
      mockQdrantClient.createSnapshot.mockResolvedValue({
        name: 'snapshot_123',
      });

      const snapshotName = await service.createSnapshot();

      expect(snapshotName).toBe('snapshot_123');
      expect(mockQdrantClient.createSnapshot).toHaveBeenCalledWith(
        'test_collection',
      );
    });

    it('should optimize collection', async () => {
      mockQdrantClient.updateCollection.mockResolvedValue({ status: 'ok' });

      await service.optimizeCollection();

      expect(mockQdrantClient.updateCollection).toHaveBeenCalledWith(
        'test_collection',
        {
          optimizers_config: expect.any(Object),
        },
      );
    });

    it('should reindex all documents', async () => {
      mockQdrantClient.deleteCollection.mockResolvedValue({ status: 'ok' });
      mockQdrantClient.collectionExists.mockResolvedValue(false);
      mockQdrantClient.createCollection.mockResolvedValue({ status: 'ok' });

      await service.reindexAllDocuments();

      expect(mockQdrantClient.deleteCollection).toHaveBeenCalledWith(
        'test_collection',
      );
      expect(mockQdrantClient.createCollection).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should pass health check when Qdrant is available', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({});
      mockQdrantClient.collectionExists.mockResolvedValue({ exists: true });

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should fail health check when Qdrant is unavailable', async () => {
      mockQdrantClient.getCollections.mockRejectedValue(
        new Error('Connection failed'),
      );

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry operations on failure', async () => {
      // Mock to fail twice, then succeed
      mockQdrantClient.search
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue([]);

      const results = await service.searchSimilarDocuments(
        new Array(1536).fill(0.1),
      );

      expect(results).toEqual([]);
      expect(mockQdrantClient.search).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockQdrantClient.search.mockRejectedValue(new Error('Persistent error'));

      await expect(
        service.searchSimilarDocuments(new Array(1536).fill(0.1)),
      ).rejects.toThrow('Persistent error');

      expect(mockQdrantClient.search).toHaveBeenCalledTimes(3); // maxRetries = 3
    });
  });
});
