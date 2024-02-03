import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { AuthorOptions } from '../types/author-options.js';

export const constructUrl = (id: string, options?: AuthorOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/authors/${id}`, registry);
	return url;
};
