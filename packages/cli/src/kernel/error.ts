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
