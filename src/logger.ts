import { Axiom } from '@axiomhq/js';
import * as dotenv from 'dotenv';

dotenv.config();

const axiom = new Axiom({
    token: process.env.AXIOM_TOKEN || '',
});

const SERVICE_NAME = 'earn-bot';
const AXIOM_DATASET = 'earn-bot';

const baseLog = (level: 'info' | 'warn' | 'error', payload: Record<string, unknown>) => ({
    level,
    timestamp: new Date().toISOString(),
    _service: SERVICE_NAME,
    ...payload,
});

export const logInfo = async (message: string, context: Record<string, unknown> = {}) => {
    const entry = baseLog('info', { message, ...context });
    if (!axiom) {
        console.log(`[info] ${message}`, context);
        return;
    }
    try {
        await axiom.ingest(AXIOM_DATASET, [entry]);
    } catch (err) {
        console.error('Failed to send info log to Axiom:', err);
    }
};

export const logWarn = async (message: string, context: Record<string, unknown> = {}) => {
    const entry = baseLog('warn', { message, ...context });
    if (!axiom) {
        console.warn(`[warn] ${message}`, context);
        return;
    }
    try {
        await axiom.ingest(AXIOM_DATASET, [entry]);
    } catch (err) {
        console.error('Failed to send warning log to Axiom:', err);
    }
};

export const logError = async (error: Error | string, context: Record<string, unknown> = {}) => {
    const isError = error instanceof Error;
    const entry = baseLog('error', {
        message: isError ? error.message : String(error),
        stack: isError ? (error as Error).stack : undefined,
        ...context,
    });
    if (!axiom) {
        if (isError) {
            console.error('[error]', (error as Error).message, (error as Error).stack, context);
        } else {
            console.error('[error]', String(error), context);
        }
        return;
    }
    try {
        await axiom.ingest(AXIOM_DATASET, [entry]);
    } catch (err) {
        console.error('Failed to send error log to Axiom:', err);
    }
};

export type LoggerFn = (message: string, context?: Record<string, unknown>) => Promise<void>;
