export type CliErrorCode =
	| 'USAGE'
	| 'UNKNOWN_COMMAND'
	| 'CONFIG'
	| 'AUTH'
	| 'HTTP'
	| 'CONTRACT'
	| 'STATE'
	| 'SYNC'
	| 'UNKNOWN';

// A tagged, throwable CLI error. Internals throw it; the single boundary in
// run.ts catches, renders via ui, and maps `exitCode` to the process exit code.
// SCREAMING_SNAKE codes match the repo convention (@directus/errors `ErrorCode`).
export class CliError extends Error {
	readonly code: CliErrorCode;
	readonly hint: string | undefined;
	readonly exitCode: number;

	constructor(code: CliErrorCode, message: string, options: { hint?: string; exitCode?: number } = {}) {
		super(message);
		this.name = 'CliError';
		this.code = code;
		this.hint = options.hint;
		this.exitCode = options.exitCode ?? 1;
	}
}

// instanceof, not a shape check: only a real CliError instance may reach the exit
// mapping or the --json error payload — a foreign Error or a look-alike object
// (including an array carrying the same keys) must not pass.
export function isCliError(value: unknown): value is CliError {
	return value instanceof CliError;
}
