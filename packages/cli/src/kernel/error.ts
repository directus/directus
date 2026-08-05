type CliErrorCode = 'USAGE' | 'UNKNOWN_COMMAND' | 'CONFIG' | 'AUTH' | 'HTTP' | 'STATE' | 'UNKNOWN';

export class CliError extends Error {
	readonly code: CliErrorCode;
	readonly hint: string | undefined;
	readonly detail: string | undefined;

	// `| undefined` is explicit so callers can forward an optional hint or detail straight through:
	// under exactOptionalPropertyTypes a bare `hint?: string` would force every caller to guard.
	constructor(
		code: CliErrorCode,
		message: string,
		options: { hint?: string | undefined; detail?: string | undefined } = {},
	) {
		super(message);
		this.name = 'CliError';
		this.code = code;
		this.hint = options.hint;
		this.detail = options.detail;
	}
}

/** Copy a CLI error with a replacement hint while preserving its code, message, and optional detail. */
export function withHint(error: CliError, hint: string): CliError {
	return new CliError(error.code, error.message, { hint, detail: error.detail });
}
