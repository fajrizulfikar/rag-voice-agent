import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigurationService } from '../../config';

@Injectable()
export class EnvironmentValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EnvironmentValidationMiddleware.name);
  private isValidated = false;

  constructor(private readonly configService: ConfigurationService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.isValidated) {
      this.validateEnvironment();
      this.isValidated = true;
    }
    next();
  }

  private validateEnvironment(): void {
    const config = this.configService.getConfigurationSummary();
    const apiKeys = this.configService.validateApiKeys();
    
    this.logger.log('='.repeat(50));
    this.logger.log('RAG Voice Agent - Environment Validation');
    this.logger.log('='.repeat(50));
    
    this.logger.log(`Environment: ${config.environment}`);
    this.logger.log(`Port: ${config.port}`);
    this.logger.log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
    this.logger.log(`Vector DB: ${config.vectorDatabase.url} (${config.vectorDatabase.collection})`);
    
    this.logger.log('\nAPI Key Status:');
    Object.entries(config.apiKeys).forEach(([service, status]) => {
      const icon = status === 'configured' ? '✓' : '⚠️';
      this.logger.log(`  ${icon} ${service}: ${status}`);
    });

    // Check for critical missing configurations
    const criticalMissing = Object.entries(apiKeys)
      .filter(([_, isValid]) => !isValid)
      .map(([key, _]) => key);

    if (criticalMissing.length > 0) {
      this.logger.warn('\n⚠️  WARNING: Critical configurations missing or using placeholder values:');
      criticalMissing.forEach(key => {
        this.logger.warn(`  - ${key.toUpperCase()}`);
      });
      this.logger.warn('\n  Please update your .env file with actual values.');
      this.logger.warn('  Some features may not work properly until configured.');
    } else {
      this.logger.log('\n✓ All critical configurations are properly set.');
    }

    this.logger.log('='.repeat(50));
  }
}