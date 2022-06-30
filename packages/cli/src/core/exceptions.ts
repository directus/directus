import redent from 'redent';

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
		super(redent(message).trim());
		this.code = code;
	}
}
