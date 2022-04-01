import { RuntimeException } from 'node-exceptions';

export class AuthorizationRequired extends RuntimeException {
	raw: Error;
	constructor(err: Error, path: string) {
		super(`Unauthorized to access file ${path}\n${err.message}`, 500, 'E_AUTHORIZATION_REQUIRED');
		this.raw = err;
	}
}
