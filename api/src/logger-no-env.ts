import pino, { LoggerOptions } from 'pino';

const pinoOptions: LoggerOptions = { level: 'info' };

pinoOptions.prettyPrint = true;
pinoOptions.prettifier = require('pino-colada');

const logger = pino(pinoOptions);

export default logger;
