import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
};

export class NotNullViolationException extends BaseException {
	constructor(field: string, exceptions?: Exceptions) {
		super(`Value for field "${field}" can't be null.`, 400, 'NOT_NULL_VIOLATION', exceptions);
	}
}
