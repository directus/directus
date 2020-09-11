import { BaseException } from './base';

export class DatabaseNotFoundException extends BaseException {
	constructor(message: string) {
		super(message, 404, 'DB_FILE_NOT_FOUND');
	}
}
