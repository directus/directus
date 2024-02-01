import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { ListOptions } from '../types/list-options.js';
import type { ListQuery } from '../types/list-query.js';

export const constructUrl = (query: ListQuery, options?: ListOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;

	const url = new URL('/extensions', registry);

	if (query.search) {
		url.searchParams.set('search', query.search);
	}

	if (query.type) {
		url.searchParams.set('type', query.type);
	}

	return url;
};
