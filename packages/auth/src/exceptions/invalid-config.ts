import { BaseException } from '@directus/shared/exceptions';

export class InvalidConfigException extends BaseException {
	constructor(message = 'Invalid config', provider?: string) {
		super(message, 500, 'INVALID_CONFIG', { provider });
	}
}
