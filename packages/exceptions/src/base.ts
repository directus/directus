export class BaseException extends Error {
	status: number;
	code: string;
	extensions: Record<string, any>;

	constructor(message: string, status: number, code: string, extensions?: Record<string, any>) {
		super(message);
		this.status = status;
		this.code = code;

		this.extensions = extensions || {};
	}
}
