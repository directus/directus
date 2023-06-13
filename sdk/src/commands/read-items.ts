import type { Query } from '@directus/types';
import type { DirectusClient } from '../client.js';
import type { Command, RESTCommand } from '../types/index.js';
import { serializeParams } from '../utils.js';
import type { RESTRequestOptions } from '../composables/rest.js';

export interface ReadItemsInput<Schema extends object> {
	collection: keyof Schema;
	query?: Query;
}

export type ReadItemsOutput<
	Schema extends object,
	Input extends ReadItemsInput<Schema>
> = Schema[Input['collection']][];

// export const readItems = <Schema extends object = any, Input extends ReadItemsInput<Schema> = any>(
// 	input: Input
// ): Command<ReadItemsInput<Schema>, ReadItemsOutput<Schema, Input>, DirectusClient<Schema>, Schema> => {
// 	return async (client) => {
// 		/** Build up the URL */
// 		const url = new URL(client.config['url']);
// 		url.pathname = `/items/${String(input.collection)}`;
// 		if (input.query) url.search = serializeParams(input.query);

// 		/** Do the fetch call in here */
// 		const response = await fetch(url, {
// 			method: 'GET',
// 		});

// 		const result = await response.json();

// 		return result.data as ReadItemsOutput<Schema, Input>;
// 	};
// };
export const readItems = <Schema extends object = any, Input extends ReadItemsInput<Schema> = any>(
	input: Input
): RESTCommand<Schema, ReadItemsInput<Schema>, ReadItemsOutput<Schema, Input>> => {
	return {
		path: `/items/${String(input.collection)}`,
		params: input.query ?? {},
		method: 'GET',
	};
};
