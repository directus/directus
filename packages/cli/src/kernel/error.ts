type CliErrorCode = 'USAGE' | 'UNKNOWN_COMMAND' | 'CONFIG' | 'AUTH' | 'HTTP' | 'STATE' | 'UNKNOWN';

export class CliError extends Error {
	readonly code: CliErrorCode;
	readonly hint: string | undefined;
	readonly detail: string | undefined;

	// The explicit `| undefined` lets callers forward an optional hint without guarding first, which
	// exactOptionalPropertyTypes would otherwise require.
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

export function withHint(error: CliError, hint: string): CliError {
	return new CliError(error.code, error.message, { hint, detail: error.detail });
}
