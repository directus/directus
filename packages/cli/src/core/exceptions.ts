import stripIndent from 'strip-indent';

export type CLIError = Error & {
	isAxiosError?: true;
	request?: any;
	response?: any;
	parent?: CLIError;
};

export class CLIRuntimeError extends Error {
	constructor(message: string) {
		super(stripIndent(message).trim());
	}
}
