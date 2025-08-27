import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name);

  log(message: any, context?: string) {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, context);
  }

  debug?(message: any, context?: string) {
    this.logger.debug(message, context);
  }

  verbose?(message: any, context?: string) {
    this.logger.verbose(message, context);
  }

  logQuery(query: string, userId?: string, sessionId?: string) {
    this.log(
      `Query received: ${query}`,
      `User: ${userId || 'anonymous'}, Session: ${sessionId || 'none'}`,
    );
  }

  logResponse(response: string, processingTime: number, context?: string) {
    this.log(
      `Response generated in ${processingTime}ms: ${response.substring(0, 100)}...`,
      context,
    );
  }

  logError(error: Error, context?: string, additionalInfo?: any) {
    this.error(
      `Error in ${context}: ${error.message}`,
      error.stack,
      JSON.stringify(additionalInfo),
    );
  }

  logSystemEvent(event: string, details?: any) {
    this.log(
      `System event: ${event}`,
      details ? JSON.stringify(details) : undefined,
    );
  }
}
