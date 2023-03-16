import { BaseException } from '@directus/shared/exceptions';

export class MaxFileSizeExceededException extends BaseException {
	constructor(message = 'Max file size exceeded.') {
		super(message, 413, 'MAX_FILE_SIZE_EXCEEDED');
	}
}
