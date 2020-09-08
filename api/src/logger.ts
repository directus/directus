import pino, { LoggerOptions } from 'pino';

const pinoOptions: LoggerOptions = { level: process.env.LOG_LEVEL || 'info' };

if (process.env.LOG_STYLE !== 'raw') {
	pinoOptions.prettyPrint = true;
	pinoOptions.prettifier = require('pino-colada');
}

const logger = pino(pinoOptions);

export default logger;
