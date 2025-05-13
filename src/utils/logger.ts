/**
 * Logger utility for the Agentic RPG Maker MZ Development System
 * Provides standardized logging functionality across the application
 */

import winston from 'winston';

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, context }) => {
      return `${timestamp} [${context || 'Global'}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ],
});

// Setup logger
export function setupLogger(): void {
  // Set default log level
  const logLevel = process.env.LOG_LEVEL || 'info';
  logger.level = logLevel;
  
  // Log startup information
  logger.info(`Logger initialized with level: ${logLevel}`);
}

// Logger class that can be instantiated with context
export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  info(message: string): void {
    logger.info(message, { context: this.context });
  }
  
  warn(message: string): void {
    logger.warn(message, { context: this.context });
  }
  
  error(message: any): void {
    if (message instanceof Error) {
      logger.error(`${message.message}\n${message.stack}`, { context: this.context });
    } else {
      logger.error(message, { context: this.context });
    }
  }
  
  debug(message: string): void {
    logger.debug(message, { context: this.context });
  }
}
