import { createError, ErrorCode } from '../index.js';
import type { Range } from '@directus/types';

export interface RangeNotSatisfiableErrorExtensions {
	range: Range;
}

export const messageConstructor = ({ range }: RangeNotSatisfiableErrorExtensions) => {
	const rangeString = `"${range.start ?? ''}-${range.end ?? ''}"`;
	return `Range ${rangeString} is invalid or the file's size doesn't match the requested range.`;
};

export const RangeNotSatisfiableError = createError<RangeNotSatisfiableErrorExtensions>(
	ErrorCode.RangeNotSatisfiable,
	messageConstructor,
	416,
);
