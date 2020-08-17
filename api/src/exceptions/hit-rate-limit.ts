import { BaseException } from './base';

export class HitRateLimitException extends BaseException {
	constructor(message: string) {
		super(message, 429, 'REQUESTS_EXCEEDED');
	}
}
