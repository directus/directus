import type Stream from 'stream';
import chalk, { type ChalkInstance } from 'chalk';
import type { Env } from './config.js';
import type { Options } from './sandbox.js';

export type Logger = {
	addGroup: (group: string) => Logger;
	fatal: (msg: string) => void;
	error: (msg: string) => void;
	warn: (msg: string) => void;
	info: (msg: string) => void;
	debug: (msg: string) => void;
	pipe: (stream: Stream.Readable | null, type?: LogLevel) => void;
	onLog: (listener: LogListener) => void;
};

export const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export type LogLevel = (typeof logLevels)[number];
export type LogListener = (message: string, type: LogLevel, groups: string[]) => void;

const listeners: { [key: string]: LogListener[] } = {};

export function createLogger(env: Env, opts: Options, ...groups: string[]): Logger {
	return {
		addGroup: (group: string) => {
			return createLogger(env, opts, ...groups, group);
		},
		fatal: (msg: string) => log(env, opts, msg, 'fatal', ...groups),
		error: (msg: string) => log(env, opts, msg, 'error', ...groups),
		warn: (msg: string) => log(env, opts, msg, 'warn', ...groups),
		info: (msg: string) => log(env, opts, msg, 'info', ...groups),
		debug: (msg: string) => log(env, opts, msg, 'debug', ...groups),
		pipe: (stream: Stream.Readable | null, type?: LogLevel) => {
			if (stream) stream.on('data', (data) => log(env, opts, String(data), type, ...groups));
		},
		onLog: (listener: LogListener) => {
			const key = groups.join('.');
			if (!listeners[key]) listeners[key] = [];
			listeners[key].push(listener);
		},
	};
}

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

export function log(env: Env, opts: Options, message: string, type: LogLevel = 'info', ...groups: string[]) {
	const formattedMessage =
		groups.map((group) => chalk.blueBright(`[${group}] `)).join('') +
		chalk[logLevelColor[type]](`[${type}] `) +
		message +
		(message.endsWith('\n') ? '' : '\n');

	if (logLevel(env.LOG_LEVEL ?? 'info') >= logLevel(type) && (!opts.silent || type === 'error' || type === 'fatal'))
		process.stdout.write(formattedMessage);

	for (const [key, listener] of Object.entries(listeners)) {
		if (groups.join('.').startsWith(key)) {
			listener.forEach((l) => l(message, type, groups));
		}
	}
}
