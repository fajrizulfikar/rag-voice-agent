import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VectorService } from './rag/vector.service';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly vectorService: VectorService,
  ) {}

  getHello(): string {
    return 'Voice-Powered RAG FAQ Agent Backend API';
  }

  async getHealth(): Promise<object> {
    const timestamp = new Date().toISOString();
    const baseInfo = {
      timestamp,
      service: 'Voice-Powered RAG FAQ Agent',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      // Check database connection
      await this.dataSource.query('SELECT 1');
      const databaseStatus = {
        status: 'connected',
        type: 'postgres',
      };

      // Check vector database connection
      const vectorDbHealthy = await this.vectorService.healthCheck();
      const vectorDbStatus = {
        status: vectorDbHealthy ? 'connected' : 'disconnected',
        type: 'qdrant',
      };

      const overallStatus = vectorDbHealthy ? 'ok' : 'degraded';

      return {
        ...baseInfo,
        status: overallStatus,
        database: databaseStatus,
        vectorDatabase: vectorDbStatus,
      };
    } catch (error) {
      // Check vector database even if postgres fails
      const vectorDbHealthy = await this.vectorService.healthCheck();
      
      return {
        ...baseInfo,
        status: 'error',
        database: {
          status: 'disconnected',
          error: error.message,
        },
        vectorDatabase: {
          status: vectorDbHealthy ? 'connected' : 'disconnected',
          type: 'qdrant',
        },
      };
    }
  }
}
