import type { ArrayFn } from './function/array.js';
import type { ExtractFn } from './function/extract.js';

export interface AbstractQueryFunction {
	type: 'fn';

	fn: ExtractFn | ArrayFn;

	field: string;

	/*
	 * Those are currently not really needed but.
	 * Both, the extract functions and the count function don't allow arguments.
	 * However, this functionality is already implemented.
	 */
	args?: (string | number | boolean)[];
}
