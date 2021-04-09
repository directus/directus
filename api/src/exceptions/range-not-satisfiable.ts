import { BaseException } from './base';
import { Range } from '@directus/drive';

export class RangeNotSatisfiableException extends BaseException {
	constructor(range: Range) {
		super(
			`Range "${range.start}-${range.end}" is invalid or the file's size doesn't match the requested range.`,
			416,
			'RANGE_NOT_SATISFIABLE'
		);
	}
}
