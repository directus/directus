import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
};

export class ValueTooLongException extends BaseException {
	constructor(field: string, exceptions?: Exceptions) {
		super(`Value for field "${field}" is too long.`, 400, 'VALUE_TOO_LONG', exceptions);
	}
}
