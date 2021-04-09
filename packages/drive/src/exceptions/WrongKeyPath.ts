import { RuntimeException } from 'node-exceptions';

export class WrongKeyPath extends RuntimeException {
	raw: Error;
	constructor(err: Error, path: string) {
		super(`The key path does not exist: ${path}\n${err.message}`, 500, 'E_WRONG_KEY_PATH');
		this.raw = err;
	}
}
