import { BaseException } from './base';

export class RedisNotFoundException extends BaseException {
	constructor(message: string) {
		super(message, 503, 'REDIS_NOT_FOUND');
	}
}
