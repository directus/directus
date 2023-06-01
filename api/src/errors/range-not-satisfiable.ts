import { createError } from '@directus/errors';
import type { Range } from '@directus/storage';

interface RangeNotSatisfiableErrorExtensions {
	range: Range;
}

export const messageConstructor = ({ range }: RangeNotSatisfiableErrorExtensions) => {
	const rangeString = `"${range.start ?? ''}-${range.end ?? ''}"`;
	return `Range ${rangeString} is invalid or the file's size doesn't match the requested range.`;
};

export const RangeNotSatisfiableError = createError<RangeNotSatisfiableErrorExtensions>(
	'RANGE_NOT_SATISFIABLE',
	messageConstructor,
	416
);
