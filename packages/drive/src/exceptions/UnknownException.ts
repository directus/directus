import { RuntimeException } from 'node-exceptions';

export class UnknownException extends RuntimeException {
	raw: Error;
	constructor(err: Error, errorCode: string, path: string) {
		super(
			`An unknown error happened with the file ${path}.
Please open an issue at https://github.com/directus/directus/issues

Error code: ${errorCode}
Original stack:
${err.stack}`,
			500,
			'E_UNKNOWN'
		);
		this.raw = err;
	}
}
