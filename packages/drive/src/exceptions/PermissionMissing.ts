import { RuntimeException } from 'node-exceptions';

export class PermissionMissing extends RuntimeException {
	raw: Error;
	constructor(err: Error, path: string) {
		super(`Missing permission for file ${path}\n${err.message}`, 500, 'E_PERMISSION_MISSING');
		this.raw = err;
	}
}
