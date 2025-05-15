import type { LogEntry } from '@/types/evmauth';

/**
 * EVM Auth Logger
 * Enhanced logging for the EVMAuth middleware
 */
class Logger {
    private enabled: boolean;
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    constructor() {
        // Enable logging by default in development
        this.enabled = process.env.NODE_ENV !== 'test';
    }

    /**
     * Enable or disable logging
     * @param enabled Whether logging is enabled
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Set the maximum number of logs to store in memory
     * @param maxLogs The maximum number of logs
     */
    setMaxLogs(maxLogs: number): void {
        this.maxLogs = maxLogs;
    }

    /**
     * Log a debug message
     * @param entry The log entry
     */
    debug(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
        this.log({
            ...entry,
            level: 'debug',
        });
    }

    /**
     * Log an info message
     * @param entry The log entry
     */
    info(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
        this.log({
            ...entry,
            level: 'info',
        });
    }

    /**
     * Log a warning message
     * @param entry The log entry
     */
    warn(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
        this.log({
            ...entry,
            level: 'warn',
        });
    }

    /**
     * Log an error message
     * @param entry The log entry
     */
    error(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
        this.log({
            ...entry,
            level: 'error',
        });
    }

    /**
     * Log a critical message
     * @param entry The log entry
     */
    critical(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
        this.log({
            ...entry,
            level: 'critical',
        });
    }

    /**
     * Log a message
     * @param entry The log entry
     */
    private log(entry: Omit<LogEntry, 'timestamp'>): void {
        if (!this.enabled) return;

        // Add timestamp
        const logEntry: LogEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };

        // Add to logs
        this.logs.push(logEntry);

        // Trim logs if necessary
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Output to console in development
        if (process.env.NODE_ENV === 'development') {
            this.outputToConsole(logEntry);
        }
    }

    /**
     * Output a log entry to the console
     * @param entry The log entry
     */
    private outputToConsole(entry: LogEntry): void {
        const { level, category, message, component, operationId, data } = entry;

        // Format log entry
        const logData = [
            `[${new Date().toLocaleTimeString()}]`,
            `[${level.toUpperCase()}]`,
            `[${category}]`,
            `[${component}]`,
            operationId ? `[${operationId}]` : '',
            message,
            data ? JSON.stringify(data, null, 2) : '',
        ]
            .filter(Boolean)
            .join(' ');

        // Output to console with appropriate level
        switch (level) {
            case 'debug':
                console.debug(logData);
                break;
            case 'info':
                console.info(logData);
                break;
            case 'warn':
                console.warn(logData);
                break;
            case 'error':
            case 'critical':
                console.error(logData);
                break;
        }
    }

    /**
     * Get all logs
     * @returns Array of log entries
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs for a specific operation
     * @param operationId The operation ID
     * @returns Array of log entries for the operation
     */
    getOperationLogs(operationId: string): LogEntry[] {
        return this.logs.filter((log) => log.operationId === operationId);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }
}

// Export singleton instance
export const logger = new Logger();
