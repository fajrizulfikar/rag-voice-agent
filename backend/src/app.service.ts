import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Voice-Powered RAG FAQ Agent Backend API';
  }

  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Voice-Powered RAG FAQ Agent',
      version: '1.0.0',
    };
  }
}
