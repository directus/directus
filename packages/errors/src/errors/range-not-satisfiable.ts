import type { Range } from '@directus/types';
import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface RangeNotSatisfiableErrorExtensions {
	range: Range;
}

export const messageConstructor = ({ range }: RangeNotSatisfiableErrorExtensions) => {
	const rangeString = `"${range.start ?? ''}-${range.end ?? ''}"`;
	return `Range ${rangeString} is invalid or the file's size doesn't match the requested range.`;
};

export const RangeNotSatisfiableError: DirectusErrorConstructor<RangeNotSatisfiableErrorExtensions> =
	createError<RangeNotSatisfiableErrorExtensions>(ErrorCode.RangeNotSatisfiable, messageConstructor, 416);
