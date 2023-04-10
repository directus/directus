import { BaseException } from '@directus/exceptions';

export class InvalidProviderException extends BaseException {
	constructor(message = 'Invalid provider.') {
		super(message, 403, 'INVALID_PROVIDER');
	}
}
