import { Module, Global } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { ValidationService } from './services/validation.service';
import { FileProcessingService } from './services/file-processing.service';
import { ConfigurationService } from '../config';
import { EnvironmentValidationMiddleware } from './middleware';

@Global()
@Module({
  providers: [
    LoggingService,
    ValidationService,
    FileProcessingService,
    ConfigurationService,
    EnvironmentValidationMiddleware,
  ],
  exports: [
    LoggingService,
    ValidationService,
    FileProcessingService,
    ConfigurationService,
    EnvironmentValidationMiddleware,
  ],
})
export class CommonModule {}
