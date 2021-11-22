import stripIndent from 'strip-indent';

export type CLIError = Error & {
	isAxiosError?: true;
	request?: any;
	response?: any;
	parent?: CLIError;
	code?: string;
};

export class CLIRuntimeError extends Error {
	public readonly code?: string;
	constructor(message: string, code?: string) {
		super(stripIndent(message).trim());
		this.code = code;
	}
}
