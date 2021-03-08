import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
	invalid: string;
};

export class ValueOutOfRangeException extends BaseException {
	constructor(message: string, exceptions?: Exceptions) {
		super(message, 400, 'VALUE_OUT_OF_RANGE', exceptions);
	}
}
