import { BaseException } from '../base';

type Extensions = {
	collection: string;
	field: string;
	invalid: string;
};

export class RecordNotUniqueException extends BaseException {
	constructor(message: string, extensions?: Extensions) {
		super(message, 400, 'RECORD_NOT_UNIQUE', extensions);
	}
}
