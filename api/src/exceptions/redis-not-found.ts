import { BaseException } from './base';

export class RedisNotFoundException extends BaseException {
	constructor(message: string) {
		super(message, 404, 'REDIS_NOT_FOUND');
	}
}
