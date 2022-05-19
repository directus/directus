import { BaseException } from '@directus/shared/exceptions';

export class RangeNotSatisfiableException extends BaseException {
	constructor(rangeValue: string) {
		super(
			`Range "${rangeValue}" is invalid or the file's size doesn't match the requested range.`,
			416,
			'RANGE_NOT_SATISFIABLE'
		);
	}
}
