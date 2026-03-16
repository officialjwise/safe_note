/**
 * Centralized logging service for debugging and monitoring
 * Logs all network traffic, auth events, and app lifecycle
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private logLevel = LogLevel.DEBUG;

  log(category: string, message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.DEBUG, category, message, data, source);
  }

  info(category: string, message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.INFO, category, message, data, source);
  }

  warn(category: string, message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.WARN, category, message, data, source);
  }

  error(category: string, message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.ERROR, category, message, data, source);
  }

  private addLog(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    source?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      source: source || 'App',
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const levelName = LogLevel[level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${category}]`;
    const logFn = this.getLogFunction(level);

    if (data) {
      logFn(`${prefix} ${message}`, data);
    } else {
      logFn(`${prefix} ${message}`);
    }
  }

  private getLogFunction(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      default:
        return console.log;
    }
  }

  getLogs(category?: string, level?: LogLevel): LogEntry[] {
    return this.logs.filter(
      (log) =>
        (!category || log.category === category) && (!level || log.level >= level)
    );
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Network logging helpers
  logNetworkRequest(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): void {
    this.info('NETWORK', `${method} ${url}`, { data, headers }, 'Network');
  }

  logNetworkResponse(
    method: string,
    url: string,
    status: number,
    data?: any,
    duration?: number
  ): void {
    this.info('NETWORK', `${method} ${url} - ${status}`, { data, duration }, 'Network');
  }

  logNetworkError(
    method: string,
    url: string,
    error: any,
    duration?: number
  ): void {
    this.error('NETWORK', `${method} ${url} - FAILED`, { error, duration }, 'Network');
  }

  // Auth logging helpers
  logAuthEvent(event: string, data?: any): void {
    this.info('AUTH', event, data, 'Auth');
  }

  logAuthError(error: string, data?: any): void {
    this.error('AUTH', error, data, 'Auth');
  }
}

export const logger = new Logger();
export { LogLevel };
