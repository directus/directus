import { createError } from '@directus/errors';
import type { Range } from '@directus/storage';
import { ErrorCode } from './codes.js';

interface RangeNotSatisfiableErrorExtensions {
	range: Range;
}

export const messageConstructor = ({ range }: RangeNotSatisfiableErrorExtensions) => {
	const rangeString = `"${range.start ?? ''}-${range.end ?? ''}"`;
	return `Range ${rangeString} is invalid or the file's size doesn't match the requested range.`;
};

export const RangeNotSatisfiableError = createError<RangeNotSatisfiableErrorExtensions>(
	ErrorCode.RangeNotSatisfiable,
	messageConstructor,
	416
);
