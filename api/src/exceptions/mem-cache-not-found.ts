import { BaseException } from './base';

export class MemCacheNotFoundException extends BaseException {
	constructor(message: string) {
		super(message, 503, 'MEMCACHE_NOT_FOUND');
	}
}
