import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
};

export class ValueTooLongException extends BaseException {
	constructor(message: string, exceptions?: Exceptions) {
		super(message, 400, 'VALUE_TOO_LONG', exceptions);
	}
}
