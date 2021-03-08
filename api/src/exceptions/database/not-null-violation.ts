import { BaseException } from '../base';

type Exceptions = {
	collection: string;
	field: string;
};

export class NotNullViolationException extends BaseException {
	constructor(message: string, exceptions?: Exceptions) {
		super(message, 400, 'NOT_NULL_VIOLATION', exceptions);
	}
}
