import pino, { LoggerOptions } from 'pino';
import env from './env';

const pinoOptions: LoggerOptions = { level: env.LOG_LEVEL || 'info' };

if (env.LOG_STYLE !== 'raw') {
	pinoOptions.prettyPrint = true;
	pinoOptions.prettifier = require('pino-colada');
}

const logger = pino(pinoOptions);

export default logger;
