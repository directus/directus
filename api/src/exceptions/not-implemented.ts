import { BaseException } from '@directus/shared/exceptions';

export class NotImplementedException extends BaseException {
	constructor(message = 'Not implemented') {
		super(message, 501, 'NOT_IMPLEMENTED');
	}
}
