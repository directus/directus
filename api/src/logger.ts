import { Request, RequestHandler } from 'express';
import pino, { LoggerOptions } from 'pino';
import pinoHTTP, { stdSerializers } from 'pino-http';
import { URL } from 'url';
import env from './env';

const pinoOptions: LoggerOptions = {
	level: env.LOG_LEVEL || 'info',
	redact: {
		paths: ['req.headers.authorization', `req.cookies.${env.REFRESH_TOKEN_COOKIE_NAME}`],
		censor: '--redact--',
	},
};

if (env.LOG_STYLE !== 'raw') {
	pinoOptions.prettyPrint = true;
	pinoOptions.prettifier = require('pino-colada');
}

const logger = pino(pinoOptions);

export const expressLogger = pinoHTTP(
	{
		logger,
	},
	{
		serializers: {
			req(request: Request) {
				const output = stdSerializers.req(request);
				output.url = redactQuery(output.url);
				return output;
			},
		},
	}
) as RequestHandler;

export default logger;

function redactQuery(originalPath: string) {
	const url = new URL(originalPath, 'http://example.com/');

	if (url.searchParams.has('access_token')) {
		url.searchParams.set('access_token', '--redacted--');
	}

	return url.pathname + url.search;
}
