import { BaseException } from '../base';

type Extensions = {
	collection: string;
	field: string;
	invalid: string;
};

export class InvalidForeignKeyException extends BaseException {
	constructor(message: string, extensions?: Extensions) {
		super(message, 400, 'INVALID_FOREIGN_KEY', extensions);
	}
}
