import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string | null;
	invalid?: string;
};

export class ValueOutOfRangeException extends BaseException {
	constructor(field: string | null, exceptions?: Exceptions) {
		if (field) {
			super(`Numeric value in field "${field ?? ''}" is out of range.`, 400, 'VALUE_OUT_OF_RANGE', exceptions);
		} else {
			super(`Numeric value is out of range.`, 400, 'VALUE_OUT_OF_RANGE', exceptions);
		}
	}
}
