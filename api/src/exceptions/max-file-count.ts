import { BaseException } from '@directus/shared/exceptions';

export class MaxFileCountExceededException extends BaseException {
	constructor(message = 'Max file count exceeded.') {
		super(message, 413, 'MAX_FILE_COUNT_EXCEEDED');
	}
}
