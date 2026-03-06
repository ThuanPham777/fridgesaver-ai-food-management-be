// src/core/logger/logger.service.ts
// Custom logger service with enhanced logging capabilities

import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

export type LogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose';

export interface LogContext {
  context?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private static logLevel: LogLevel = 'debug';

  private static readonly logLevelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    log: 2,
    debug: 3,
    verbose: 4,
  };

  setContext(context: string): void {
    this.context = context;
  }

  static setLogLevel(level: LogLevel): void {
    LoggerService.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      LoggerService.logLevelPriority[level] <=
      LoggerService.logLevelPriority[LoggerService.logLevel]
    );
  }

  private formatMessage(
    level: LogLevel,
    message: any,
    context?: string,
    additionalContext?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const formattedLevel = level.toUpperCase().padEnd(7);

    let logMessage = `[${timestamp}] [${formattedLevel}] [${ctx}] ${message}`;

    if (additionalContext && Object.keys(additionalContext).length > 0) {
      const contextStr = Object.entries(additionalContext)
        .filter(([key]) => key !== 'context')
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      if (contextStr) {
        logMessage += ` | ${contextStr}`;
      }
    }

    return logMessage;
  }

  log(message: any, context?: string | LogContext): void {
    if (!this.shouldLog('log')) return;

    const ctx = typeof context === 'string' ? context : context?.context;
    const additionalContext = typeof context === 'object' ? context : undefined;

    console.log(this.formatMessage('log', message, ctx, additionalContext));
  }

  error(message: any, trace?: string, context?: string | LogContext): void {
    if (!this.shouldLog('error')) return;

    const ctx = typeof context === 'string' ? context : context?.context;
    const additionalContext = typeof context === 'object' ? context : undefined;

    console.error(this.formatMessage('error', message, ctx, additionalContext));
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string | LogContext): void {
    if (!this.shouldLog('warn')) return;

    const ctx = typeof context === 'string' ? context : context?.context;
    const additionalContext = typeof context === 'object' ? context : undefined;

    console.warn(this.formatMessage('warn', message, ctx, additionalContext));
  }

  debug(message: any, context?: string | LogContext): void {
    if (!this.shouldLog('debug')) return;

    const ctx = typeof context === 'string' ? context : context?.context;
    const additionalContext = typeof context === 'object' ? context : undefined;

    console.debug(this.formatMessage('debug', message, ctx, additionalContext));
  }

  verbose(message: any, context?: string | LogContext): void {
    if (!this.shouldLog('verbose')) return;

    const ctx = typeof context === 'string' ? context : context?.context;
    const additionalContext = typeof context === 'object' ? context : undefined;

    console.log(this.formatMessage('verbose', message, ctx, additionalContext));
  }
}
