import { URL } from 'node:url';
import { useEnv } from '@directus/env';
import { REDACTED_TEXT, toArray, toBoolean } from '@directus/utils';
import type { Request, RequestHandler } from 'express';
import { merge } from 'lodash-es';
import { type Logger, type LoggerOptions, pino } from 'pino';
import { type AutoLoggingOptions, pinoHttp, stdSerializers } from 'pino-http';
import { httpPrintFactory } from 'pino-http-print';
import { build as pinoPretty } from 'pino-pretty';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { LogsStream } from './logs-stream.js';
import { redactQuery } from './redact-query.js';

export const _cache: {
	logger: Logger<never> | undefined;
	logsStream: LogsStream | undefined;
	httpLogsStream: LogsStream | undefined;
} = { logger: undefined, logsStream: undefined, httpLogsStream: undefined };

export const useLogger = () => {
	if (_cache.logger) {
		return _cache.logger;
	}

	_cache.logger = createLogger();

	return _cache.logger;
};

export const getLogsStream = (pretty: boolean) => {
	if (_cache.logsStream) {
		return _cache.logsStream;
	}

	_cache.logsStream = new LogsStream(pretty ? 'basic' : false);

	return _cache.logsStream;
};

export const getHttpLogsStream = (pretty: boolean) => {
	if (_cache.httpLogsStream) {
		return _cache.httpLogsStream;
	}

	_cache.httpLogsStream = new LogsStream(pretty ? 'http' : false);

	return _cache.httpLogsStream;
};

export const getLoggerLevelValue = (level: string): number => {
	return pino.levels.values[level] || pino.levels.values['info']!;
};

export const createLogger = () => {
	const env = useEnv();

	const pinoOptions: LoggerOptions = {
		level: (env['LOG_LEVEL'] as string) || 'info',
		redact: {
			paths: ['req.headers.authorization', 'req.headers.cookie'],
			censor: REDACTED_TEXT,
		},
	};

	const loggerEnvConfig = getConfigFromEnv('LOGGER_', { omitPrefix: 'LOGGER_HTTP' });

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

		delete loggerEnvConfig['levels'];
	}

	const mergedOptions = merge(pinoOptions, loggerEnvConfig);
	const streams = [];

	// Console Logs
	if (env['LOG_STYLE'] !== 'raw') {
		streams.push({
			level: mergedOptions.level!,
			stream: pinoPretty({
				ignore: 'hostname,pid',
				sync: true,
			}),
		});
	} else {
		streams.push({ level: mergedOptions.level!, stream: process.stdout });
	}

	// WebSocket Logs
	if (toBoolean(env['WEBSOCKETS_LOGS_ENABLED'])) {
		const wsLevel = (env['WEBSOCKETS_LOGS_LEVEL'] as string) || 'info';

		if (getLoggerLevelValue(wsLevel) < getLoggerLevelValue(mergedOptions.level!)) {
			mergedOptions.level = wsLevel;
		}

		streams.push({
			level: wsLevel,
			stream: getLogsStream(env['WEBSOCKETS_LOGS_STYLE'] !== 'raw'),
		});
	}

	return pino(mergedOptions, pino.multistream(streams));
};

export const createExpressLogger = () => {
	const env = useEnv();

	const httpLoggerEnvConfig = getConfigFromEnv('LOGGER_HTTP', { omitPrefix: 'LOGGER_HTTP_LOGGER' });
	const loggerEnvConfig = getConfigFromEnv('LOGGER_', { omitPrefix: 'LOGGER_HTTP' });

	const httpLoggerOptions: LoggerOptions = {
		level: (env['LOG_LEVEL'] as string) || 'info',
		redact: {
			paths: ['req.headers.authorization', 'req.headers.cookie'],
			censor: REDACTED_TEXT,
		},
	};

	if (env['LOG_STYLE'] === 'raw' || toBoolean(env['WEBSOCKETS_LOGS_ENABLED'])) {
		httpLoggerOptions.redact = {
			paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers', 'req.query.access_token'],
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

	// Expose custom log levels into formatter function
	if (loggerEnvConfig['levels']) {
		const customLogLevels: { [key: string]: string } = {};

		for (const el of toArray(loggerEnvConfig['levels'])) {
			const key_val = el.split(':');
			customLogLevels[key_val[0].trim()] = key_val[1].trim();
		}

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

	if (env['LOG_HTTP_IGNORE_PATHS']) {
		const ignorePathsSet = new Set(env['LOG_HTTP_IGNORE_PATHS'] as string);

		httpLoggerEnvConfig['autoLogging'] = {
			ignore: (req) => {
				if (!req.url) return false;
				const { pathname } = new URL(req.url, 'http://example.com/');
				return ignorePathsSet.has(pathname);
			},
		} as AutoLoggingOptions;
	}

	const mergedHttpOptions = merge(httpLoggerOptions, loggerEnvConfig);
	const streams = [];

	if (env['LOG_STYLE'] !== 'raw') {
		const pinoHttpPretty = httpPrintFactory({
			all: true,
			translateTime: 'SYS:HH:MM:ss',
			relativeUrl: true,
			prettyOptions: {
				ignore: 'hostname,pid',
				sync: true,
			},
		});

		streams.push({ level: mergedHttpOptions.level!, stream: pinoHttpPretty(process.stdout) });
	} else {
		streams.push({ level: mergedHttpOptions.level!, stream: process.stdout });
	}

	// WebSocket Logs
	if (toBoolean(env['WEBSOCKETS_LOGS_ENABLED'])) {
		const wsLevel = (env['WEBSOCKETS_LOGS_LEVEL'] as string) || 'info';

		if (getLoggerLevelValue(wsLevel) < getLoggerLevelValue(mergedHttpOptions.level!)) {
			mergedHttpOptions.level = wsLevel;
		}

		streams.push({
			level: wsLevel,
			stream: getHttpLogsStream(env['WEBSOCKETS_LOGS_STYLE'] !== 'raw'),
		});
	}

	return pinoHttp({
		logger: pino(mergedHttpOptions, pino.multistream(streams)),
		...httpLoggerEnvConfig,
		serializers: {
			req(request: Request) {
				const output = stdSerializers.req(request);
				output.url = redactQuery(output.url);
				return output;
			},
		},
	}) as RequestHandler;
};
