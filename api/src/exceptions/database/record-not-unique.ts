import { BaseException } from '../base';

type Extensions = {
	collection: string;
	field: string;
	invalid?: string;
};

export class RecordNotUniqueException extends BaseException {
	constructor(field: string, extensions?: Extensions) {
		super(`Field "${field}" has to be unique.`, 400, 'RECORD_NOT_UNIQUE', extensions);
	}
}
