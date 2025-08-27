import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Voice-Powered RAG FAQ Agent Backend API';
  }

  async getHealth(): Promise<object> {
    try {
      // Check database connection
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Voice-Powered RAG FAQ Agent',
        version: '1.0.0',
        database: {
          status: 'connected',
          type: 'postgres',
        },
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'Voice-Powered RAG FAQ Agent',
        version: '1.0.0',
        database: {
          status: 'disconnected',
          error: error.message,
        },
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }
}
