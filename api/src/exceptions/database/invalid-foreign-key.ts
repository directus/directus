import { BaseException } from '../base';

type Extensions = {
	collection: string;
	field: string;
	invalid?: string;
};

export class InvalidForeignKeyException extends BaseException {
	constructor(field: string | null, extensions?: Extensions) {
		if (field) {
			super(`Invalid foreign key in field "${field}".`, 400, 'INVALID_FOREIGN_KEY', extensions);
		} else {
			super(`Invalid foreign key.`, 400, 'INVALID_FOREIGN_KEY', extensions);
		}
	}
}
