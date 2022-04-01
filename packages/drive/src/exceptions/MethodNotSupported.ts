import { RuntimeException } from 'node-exceptions';

export class MethodNotSupported extends RuntimeException {
	constructor(name: string, driver: string) {
		super(`Method ${name} is not supported for the driver ${driver}`, 500, 'E_METHOD_NOT_SUPPORTED');
	}
}
