import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
    // Store original console methods
    const originalConsole = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
    };

    // Mock console methods
    beforeEach(() => {
        console.debug = vi.fn();
        console.info = vi.fn();
        console.warn = vi.fn();
        console.error = vi.fn();

        // Clear logs
        logger.clearLogs();

        // Enable logging for tests
        logger.setEnabled(true);
    });

    // Restore original console methods
    afterEach(() => {
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    });

    describe('Log Levels', () => {
        it('should log debug message', () => {
            const logEntry = {
                category: 'system' as const,
                message: 'Debug message',
                component: 'test',
            };

            logger.debug(logEntry);

            const logs = logger.getLogs();
            expect(logs.length).toBe(1);
            expect(logs[0].level).toBe('debug');
            expect(logs[0].message).toBe('Debug message');
        });

        it('should log info message', () => {
            const logEntry = {
                category: 'system' as const,
                message: 'Info message',
                component: 'test',
            };

            logger.info(logEntry);

            const logs = logger.getLogs();
            expect(logs.length).toBe(1);
            expect(logs[0].level).toBe('info');
            expect(logs[0].message).toBe('Info message');
        });

        it('should log warn message', () => {
            const logEntry = {
                category: 'system' as const,
                message: 'Warning message',
                component: 'test',
            };

            logger.warn(logEntry);

            const logs = logger.getLogs();
            expect(logs.length).toBe(1);
            expect(logs[0].level).toBe('warn');
            expect(logs[0].message).toBe('Warning message');
        });

        it('should log error message', () => {
            const logEntry = {
                category: 'system' as const,
                message: 'Error message',
                component: 'test',
            };

            logger.error(logEntry);

            const logs = logger.getLogs();
            expect(logs.length).toBe(1);
            expect(logs[0].level).toBe('error');
            expect(logs[0].message).toBe('Error message');
        });

        it('should log critical message', () => {
            const logEntry = {
                category: 'system' as const,
                message: 'Critical message',
                component: 'test',
            };

            logger.critical(logEntry);

            const logs = logger.getLogs();
            expect(logs.length).toBe(1);
            expect(logs[0].level).toBe('critical');
            expect(logs[0].message).toBe('Critical message');
        });
    });

    describe('Log Operations', () => {
        it('should add timestamp to logs', () => {
            logger.info({
                category: 'system',
                message: 'Test message',
                component: 'test',
            });

            const logs = logger.getLogs();
            expect(logs[0].timestamp).toBeDefined();
            expect(new Date(logs[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
        });

        it('should store operation ID with logs', () => {
            const operationId = 'test-operation-123';

            logger.info({
                category: 'system',
                message: 'Test message',
                component: 'test',
                operationId,
            });

            const logs = logger.getLogs();
            expect(logs[0].operationId).toBe(operationId);
        });

        it('should store additional data with logs', () => {
            const data = { key: 'value', count: 42 };

            logger.info({
                category: 'system',
                message: 'Test message',
                component: 'test',
                data,
            });

            const logs = logger.getLogs();
            expect(logs[0].data).toEqual(data);
        });

        it('should respect maximum log count', () => {
            // Set max logs to 5
            logger.setMaxLogs(5);

            // Add 10 logs
            for (let i = 0; i < 10; i++) {
                logger.info({
                    category: 'system',
                    message: `Log ${i}`,
                    component: 'test',
                });
            }

            // Should only keep the last 5
            const logs = logger.getLogs();
            expect(logs.length).toBe(5);
            expect(logs[0].message).toBe('Log 5');
            expect(logs[4].message).toBe('Log 9');
        });

        it('should not log when disabled', () => {
            // Disable logging
            logger.setEnabled(false);

            logger.info({
                category: 'system',
                message: 'Test message',
                component: 'test',
            });

            const logs = logger.getLogs();
            expect(logs.length).toBe(0);
        });
    });

    describe('Log Retrieval', () => {
        it('should retrieve all logs', () => {
            // Add some logs
            logger.info({
                category: 'system',
                message: 'Info message',
                component: 'test',
            });

            logger.error({
                category: 'system',
                message: 'Error message',
                component: 'test',
            });

            const logs = logger.getLogs();
            expect(logs.length).toBe(2);
            expect(logs[0].message).toBe('Info message');
            expect(logs[1].message).toBe('Error message');
        });

        it('should filter logs by operation ID', () => {
            // Add logs with different operation IDs
            logger.info({
                category: 'system',
                message: 'Message 1',
                component: 'test',
                operationId: 'op1',
            });

            logger.info({
                category: 'system',
                message: 'Message 2',
                component: 'test',
                operationId: 'op2',
            });

            logger.error({
                category: 'system',
                message: 'Message 3',
                component: 'test',
                operationId: 'op1',
            });

            // Get logs for operation 1
            const op1Logs = logger.getOperationLogs('op1');
            expect(op1Logs.length).toBe(2);
            expect(op1Logs[0].message).toBe('Message 1');
            expect(op1Logs[1].message).toBe('Message 3');

            // Get logs for operation 2
            const op2Logs = logger.getOperationLogs('op2');
            expect(op2Logs.length).toBe(1);
            expect(op2Logs[0].message).toBe('Message 2');
        });

        it('should clear all logs', () => {
            // Add some logs
            logger.info({
                category: 'system',
                message: 'Info message',
                component: 'test',
            });

            logger.error({
                category: 'system',
                message: 'Error message',
                component: 'test',
            });

            // Clear logs
            logger.clearLogs();

            const logs = logger.getLogs();
            expect(logs.length).toBe(0);
        });
    });
});
