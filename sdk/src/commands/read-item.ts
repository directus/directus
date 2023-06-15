import type { PrimaryKey, Query } from '@directus/types';
import type { DirectusClientConfig } from '../client/index.js';
import type { ApiResponse, Command } from '../types/index.js';
import { serializeParams } from '../utils.js';

export type ReadItemInput<Collection> = {
	collection: Collection;
	id: PrimaryKey;
	query?: Query;
};

export const readItem = <C extends keyof Schema, Item extends Schema[C], Schema extends object = any>(
	input: ReadItemInput<C>
): Command<ApiResponse<Partial<Item>>, DirectusClientConfig, Schema> => {
	return async (config) => {
		/** Build up the URL */
		const url = new URL(config.url);
		url.pathname = `/items/${String(input.collection)}/${String(input.id)}`;
		if (input.query) url.search = serializeParams(input.query);

		/** Do the fetch call in here */
		const response = await fetch(url, {
			method: 'GET',
		});

		const result = await response.json();

		return result as ApiResponse<Partial<Item>>;
	};
};
