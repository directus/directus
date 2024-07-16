export enum LOG_LEVEL {
	TRACE = 10,
	DEBUG = 20,
	INFO = 30,
	WARN = 40,
	ERROR = 50,
	FATAL = 60,
}

export const LOG_LEVELS = {
	trace: LOG_LEVEL.TRACE,
	debug: LOG_LEVEL.DEBUG,
	info: LOG_LEVEL.INFO,
	warn: LOG_LEVEL.WARN,
	error: LOG_LEVEL.ERROR,
	fatal: LOG_LEVEL.FATAL,
} as const;
