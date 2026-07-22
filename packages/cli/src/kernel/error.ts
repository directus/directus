type CliErrorCode = 'USAGE' | 'UNKNOWN_COMMAND' | 'CONFIG' | 'AUTH' | 'HTTP' | 'STATE' | 'UNKNOWN';

export class CliError extends Error {
	readonly code: CliErrorCode;
	readonly hint: string | undefined;
	readonly detail: string | undefined;

	constructor(code: CliErrorCode, message: string, options: { hint?: string; detail?: string } = {}) {
		super(message);
		this.name = 'CliError';
		this.code = code;
		this.hint = options.hint;
		this.detail = options.detail;
	}
}

/**
 * Rethrow copy of `error` with `hint` attached, preserving its code, message, and detail. Absorbs the
 * `...(detail !== undefined ? { detail } : {})` spread once: under exactOptionalPropertyTypes a literal
 * `detail: undefined` is not assignable to the optional `detail?: string`, so an absent detail must be
 * omitted from the options rather than passed through as undefined.
 */
export function withHint(error: CliError, hint: string): CliError {
	return new CliError(error.code, error.message, {
		hint,
		...(error.detail !== undefined ? { detail: error.detail } : {}),
	});
}
