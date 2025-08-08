import chalk, { type ChalkInstance } from 'chalk';
import type Stream from 'stream';

export type Logger = {
	fatal: (msg: string) => void;
	error: (msg: string) => void;
	warn: (msg: string) => void;
	info: (msg: string) => void;
	debug: (msg: string) => void;
	pipe: (stream: Stream.Readable | null, type?: LogLevel) => void;
};

export function createLogger(group?: string): Logger {
	return {
		fatal: (msg: string) => log(msg, 'fatal', group),
		error: (msg: string) => log(msg, 'error', group),
		warn: (msg: string) => log(msg, 'warn', group),
		info: (msg: string) => log(msg, 'info', group),
		debug: (msg: string) => log(msg, 'debug', group),
		pipe: (stream: Stream.Readable | null, type?: LogLevel) => {
			if (stream) stream.on('data', (data) => log(String(data), type, group));
		},
	};
}

export const logLevels = ['fatal', 'error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof logLevels)[number];

function logLevel(level: string) {
	return logLevels.findIndex((l) => l === String(level).toLowerCase());
}

const logLevelColor = {
	debug: 'blue',
	error: 'red',
	fatal: 'black',
	info: 'green',
	warn: 'yellow',
} as const satisfies Record<LogLevel, keyof ChalkInstance>;

export function log(message: string, type: LogLevel = 'info', group?: string) {
	if (logLevel(process.env['LOG_LEVEL'] ?? 'info') < logLevel(type)) return;

	process.stdout.write(
		(group ? chalk.blueBright(`[${group}] `) : '') +
			chalk[logLevelColor[type]](`[${type}] `) +
			message +
			(message.endsWith('\n') ? '' : '\n'),
	);
}
