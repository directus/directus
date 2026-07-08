import { isPlainObject } from 'lodash-es';

// Errors as data. Internals return Result<T, CliError> with a tagged code; the
// single boundary in run.ts unwraps to render + exit. First use of this pattern
// in the monorepo — the value is the discipline, not a dependency.

export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

// SCREAMING_SNAKE_CASE to match the repo convention (@directus/errors `ErrorCode`,
// which the SDK surfaces to clients). These are CLI-native categories; server
// errors relayed over HTTP should carry their own Directus code through.
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

export interface CliError {
	readonly code: CliErrorCode;
	readonly message: string;
	readonly hint: string | undefined;
	readonly exitCode: number;
}

export function cliError(
	code: CliErrorCode,
	message: string,
	options: { hint?: string; exitCode?: number } = {},
): CliError {
	return { code, message, hint: options.hint, exitCode: options.exitCode ?? 1 };
}

export function isCliError(value: unknown): value is CliError {
	// isPlainObject rejects arrays and class instances (e.g. a Node SystemError),
	// then the shape checks reject foreign objects that merely share key names —
	// nothing that isn't a real CliError should reach the --json error payload.
	if (!isPlainObject(value)) return false;
	const candidate = value as Record<string, unknown>;

	return (
		typeof candidate['code'] === 'string' &&
		typeof candidate['message'] === 'string' &&
		typeof candidate['exitCode'] === 'number'
	);
}
