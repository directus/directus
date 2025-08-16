import chalk, { type ChalkInstance } from 'chalk';
import type Stream from 'stream';

export type Logger = {
	addGroup: (group: string) => Logger;
	fatal: (msg: string) => void;
	error: (msg: string) => void;
	warn: (msg: string) => void;
	info: (msg: string) => void;
	debug: (msg: string) => void;
	pipe: (stream: Stream.Readable | null, type?: LogLevel) => void;
};

export function createLogger(...groups: string[]): Logger {
	return {
		addGroup: (group: string) => {
			return createLogger(...groups, group);
		},
		fatal: (msg: string) => log(msg, 'fatal', ...groups),
		error: (msg: string) => log(msg, 'error', ...groups),
		warn: (msg: string) => log(msg, 'warn', ...groups),
		info: (msg: string) => log(msg, 'info', ...groups),
		debug: (msg: string) => log(msg, 'debug', ...groups),
		pipe: (stream: Stream.Readable | null, type?: LogLevel) => {
			if (stream) stream.on('data', (data) => log(String(data), type, ...groups));
		},
	};
}

export const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
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
	trace: 'blueBright',
} as const satisfies Record<LogLevel, keyof ChalkInstance>;

export function log(message: string, type: LogLevel = 'info', ...groups: string[]) {
	if (logLevel(process.env['LOG_LEVEL'] ?? 'info') < logLevel(type)) return;

	process.stdout.write(
		groups.map((group) => chalk.blueBright(`[${group}] `)).join('') +
			chalk[logLevelColor[type]](`[${type}] `) +
			message +
			(message.endsWith('\n') ? '' : '\n'),
	);
}
