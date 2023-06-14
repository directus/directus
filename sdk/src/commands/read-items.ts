import type { Query } from '@directus/types';
import type { RESTCommand } from '../types/index.js';

export interface ReadItemsInput<Schema extends object> {
	collection: keyof Schema;
	query?: Query;
}

export type ReadItemsOutput<
	Schema extends object,
	Input extends ReadItemsInput<Schema>
> = Schema[Input['collection']][];

export const readItems =
	<Schema extends object, Input extends ReadItemsInput<Schema>>(
		input: Input
	): RESTCommand<ReadItemsInput<Schema>, ReadItemsOutput<Schema, Input>, Schema> =>
	() => ({
		path: `/items/${String(input.collection)}`,
		params: input.query ?? {},
		method: 'GET',
	});
