import { BaseException } from '@directus/shared/exceptions';

export class UnexpectedResponseException extends BaseException {
	constructor(message: string) {
		super(message, 500, 'UNEXPECTED_RESPONSE');
	}
}
