import { BaseException } from './base';

export class InvalidCacheKeyException extends BaseException {
	constructor(message: string) {
		super(message, 400, 'INVALID_CACHE_KEY');
	}
}
