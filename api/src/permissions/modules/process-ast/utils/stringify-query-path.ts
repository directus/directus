import type { QueryPath } from '../types.js';

export function stringifyQueryPath(queryPath: QueryPath): string {
	return queryPath.join('.');
}
