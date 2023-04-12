import { BaseException } from '@directus/exceptions';

export class MaxFileCountExceededException extends BaseException {
	constructor(message = 'Max file count exceeded.') {
		super(message, 413, 'MAX_FILE_COUNT_EXCEEDED');
	}
}
