import { REDACTED_TEXT, toArray } from '@directus/utils';
import type { Request, RequestHandler } from 'express';
import { merge } from 'lodash-es';
import { URL } from 'node:url';
import { pino, type LoggerOptions } from 'pino';
import { pinoHttp, stdSerializers, type AutoLoggingOptions } from 'pino-http';
import env from './env.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

const pinoOptions: LoggerOptions = {
	level: env['LOG_LEVEL'] || 'info',
	redact: {
		paths: ['req.headers.authorization', 'req.headers.cookie'],
		censor: REDACTED_TEXT,
	},
};

export const httpLoggerOptions: LoggerOptions = {
	level: env['LOG_LEVEL'] || 'info',
	redact: {
		paths: ['req.headers.authorization', 'req.headers.cookie'],
		censor: REDACTED_TEXT,
	},
};

if (env['LOG_STYLE'] !== 'raw') {
	pinoOptions.transport = {
		target: 'pino-pretty',
		options: {
			ignore: 'hostname,pid',
			sync: true,
		},
	};

	httpLoggerOptions.transport = {
		target: 'pino-http-print',
		options: {
			all: true,
			translateTime: 'SYS:HH:MM:ss',
			relativeUrl: true,
			prettyOptions: {
				ignore: 'hostname,pid',
				sync: true,
			},
		},
	};
}

if (env['LOG_STYLE'] === 'raw') {
	httpLoggerOptions.redact = {
		paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers'],
		censor: (value, pathParts) => {
			const path = pathParts.join('.');

			if (path === 'res.headers') {
				if ('set-cookie' in value) {
					value['set-cookie'] = REDACTED_TEXT;
				}

				return value;
			}

			return REDACTED_TEXT;
		},
	};
}

const loggerEnvConfig = getConfigFromEnv('LOGGER_', 'LOGGER_HTTP');

// Expose custom log levels into formatter function
if (loggerEnvConfig['levels']) {
	const customLogLevels: { [key: string]: string } = {};

	for (const el of toArray(loggerEnvConfig['levels'])) {
		const key_val = el.split(':');
		customLogLevels[key_val[0].trim()] = key_val[1].trim();
	}

	pinoOptions.formatters = {
		level(label: string, number: any) {
			return {
				severity: customLogLevels[label] || 'info',
				level: number,
			};
		},
	};

	httpLoggerOptions.formatters = {
		level(label: string, number: any) {
			return {
				severity: customLogLevels[label] || 'info',
				level: number,
			};
		},
	};

	delete loggerEnvConfig['levels'];
}

const logger = pino(merge(pinoOptions, loggerEnvConfig));

export const httpLoggerEnvConfig = getConfigFromEnv('LOGGER_HTTP', ['LOGGER_HTTP_LOGGER']);

if (env['LOG_HTTP_IGNORE_PATHS']) {
	const ignorePathsSet = new Set(env['LOG_HTTP_IGNORE_PATHS']);

	httpLoggerEnvConfig['autoLogging'] = {
		ignore: (req) => {
			if (!req.url) return false;
			const { pathname } = new URL(req.url, 'http://example.com/');
			return ignorePathsSet.has(pathname);
		},
	} as AutoLoggingOptions;
}

export const expressLogger = pinoHttp({
	logger: pino(merge(httpLoggerOptions, loggerEnvConfig)),
	...httpLoggerEnvConfig,
	serializers: {
		req(request: Request) {
			const output = stdSerializers.req(request);
			output.url = redactQuery(output.url);
			return output;
		},
	},
}) as RequestHandler;

export default logger;

function redactQuery(originalPath: string) {
	const url = new URL(originalPath, 'http://example.com/');

	if (url.searchParams.has('access_token')) {
		url.searchParams.set('access_token', REDACTED_TEXT);
	}

	return url.pathname + url.search;
}
