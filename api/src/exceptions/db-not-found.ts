import { BaseException } from './base';

export class DatabaseNotFoundException extends BaseException {
	constructor(message: string) {
		super(message, 503, 'DB_BACKUP_FAILED');
	}
}
