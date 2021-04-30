import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
};

export class ContainsNullValuesException extends BaseException {
	constructor(field: string, exceptions?: Exceptions) {
		super(`Field "${field}" contains null values.`, 400, 'CONTAINS_NULL_VALUES', exceptions);
	}
}
