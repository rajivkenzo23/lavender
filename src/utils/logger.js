import pino from 'pino';
import { config } from '../config/index.js';

const pinoLogger = pino({
    level: config.logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

class Logger {
    info(message) {
        console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
        pinoLogger.info(message);
    }

    success(message) {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
        pinoLogger.info(message);
    }

    warn(message) {
        console.log(`\x1b[33m[WARN]\x1b[0m ${message}`);
        pinoLogger.warn(message);
    }

    error(message) {
        console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
        pinoLogger.error(message);
    }

    debug(message) {
        if (config.debug) {
            console.log(`\x1b[35m[DEBUG]\x1b[0m ${message}`);
            pinoLogger.debug(message);
        }
    }
}

export const logger = new Logger();
