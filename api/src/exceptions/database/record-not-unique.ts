import { BaseException } from '../base';

type Extensions = {
	collection: string;
	field: string | null;
	invalid?: string;
};

export class RecordNotUniqueException extends BaseException {
	constructor(field: string | null, extensions?: Extensions) {
		if (field) {
			super(`Field "${field}" has to be unique.`, 400, 'RECORD_NOT_UNIQUE', extensions);
		} else {
			super(`Field has to be unique.`, 400, 'RECORD_NOT_UNIQUE', extensions);
		}
	}
}
