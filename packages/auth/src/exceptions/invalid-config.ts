import { RuntimeException } from 'node-exceptions';

export class InvalidConfigException extends RuntimeException {
	provider?: string;

	constructor(message = 'Invalid config', provider?: string) {
		super(message, 500, 'INVALID_CONFIG');
		this.provider = provider;
	}
}
