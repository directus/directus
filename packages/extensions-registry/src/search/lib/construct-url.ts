import type { SearchOptions } from '../types/search-options.js';

export const constructUrl = (text: string, options: Pick<SearchOptions, 'registry' | 'limit' | 'offset'>) => {
	const url = new URL('/-/v1/search', options?.registry ?? 'https://registry.npmjs.org');

	url.searchParams.set('text', text);

	if (options?.limit !== undefined) {
		url.searchParams.set('size', String(options.limit));
	}

	if (options?.offset !== undefined) {
		url.searchParams.set('from', String(options.offset));
	}

	return url;
};
