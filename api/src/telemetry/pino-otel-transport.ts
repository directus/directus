import { useEnv } from '@directus/env';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { Transform } from 'node:stream';
import { getOtelLogger } from './opentelemetry.js';

/**
 * Map pino log levels to OpenTelemetry severity numbers
 */
const PINO_TO_OTEL_SEVERITY: Record<number, SeverityNumber> = {
	10: SeverityNumber.TRACE, // trace
	20: SeverityNumber.DEBUG, // debug
	30: SeverityNumber.INFO, // info
	40: SeverityNumber.WARN, // warn
	50: SeverityNumber.ERROR, // error
	60: SeverityNumber.FATAL, // fatal
};

/**
 * Get severity text from pino level value
 */
function getLevelName(levelValue: number): string {
	const levels: Record<number, string> = {
		10: 'TRACE',
		20: 'DEBUG',
		30: 'INFO',
		40: 'WARN',
		50: 'ERROR',
		60: 'FATAL',
	};

	return levels[levelValue] || 'INFO';
}

/**
 * Creates a pino transport that sends logs to OpenTelemetry
 */
export function createPinoOtelTransport(): Transform {
	const env = useEnv();

	if (env['OPENTELEMETRY_ENABLED'] !== true) {
		// Return a no-op stream if OpenTelemetry is disabled
		return new Transform({
			transform(_chunk: unknown, _encoding: string, callback: (error?: Error | null) => void) {
				callback();
			},
		});
	}

	const otelLogger = getOtelLogger('directus-api');

	return new Transform({
		objectMode: true,
		transform(chunk: unknown, _encoding: string, callback: (error?: Error | null) => void) {
			try {
				const log = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;

				const severityNumber = PINO_TO_OTEL_SEVERITY[log.level] || SeverityNumber.INFO;

				// Extract message and attributes
				const { level, time, pid, hostname, msg, err, req, res, ...attributes } = log;

				// Build log record
				const logRecord: any = {
					severityNumber,
					severityText: level ? getLevelName(level) : 'INFO',
					body: msg || JSON.stringify(log),
					attributes: {
						...attributes,
						...(err && { error: JSON.stringify(err) }),
						...(req && { 'http.request': JSON.stringify(req) }),
						...(res && { 'http.response': JSON.stringify(res) }),
					},
					timestamp: time || Date.now(),
				};

				otelLogger.emit(logRecord);
			} catch (error) {
				// Silently fail to avoid breaking logging
			}

			callback();
		},
	});
}
