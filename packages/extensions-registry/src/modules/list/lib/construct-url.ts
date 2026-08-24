import { URL } from 'url';
import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { ListOptions } from '../types/list-options.js';
import type { ListQuery } from '../types/list-query.js';

export const constructUrl = (query: ListQuery, options?: ListOptions): URL => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;

	const url = new URL('/extensions', registry);

	if (query.search) {
		url.searchParams.set('search', query.search);
	}

	if (query.type) {
		url.searchParams.set('type', query.type);
	}

	if (query.limit) {
		url.searchParams.set('limit', String(query.limit));
	}

	if (query.offset) {
		url.searchParams.set('offset', String(query.offset));
	}

	if (query.by) {
		url.searchParams.set('by', query.by);
	}

	if (query.sort) {
		url.searchParams.set('sort', query.sort);
	}

	if (query.sandbox) {
		url.searchParams.set('sandbox', 'true');
	}

	return url;
};
