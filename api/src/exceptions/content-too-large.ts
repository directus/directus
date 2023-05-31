import { BaseException } from '@directus/exceptions';

export class ContentTooLargeException extends BaseException {
	constructor(message: string) {
		super(message, 413, 'CONTENT_TOO_LARGE');
	}
}
