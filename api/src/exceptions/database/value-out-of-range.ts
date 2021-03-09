import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
	invalid: string;
};

export class ValueOutOfRangeException extends BaseException {
	constructor(field: string, exceptions?: Exceptions) {
		super(`Numeric value in field "${field}" is out of range.`, 400, 'VALUE_OUT_OF_RANGE', exceptions);
	}
}
