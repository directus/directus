import type { DirectusClientConfig } from '../../client.js';
import type { Command } from '../types.js';

export interface ReadItemsInput<Schema extends object = any> {
	collection: keyof Schema;
}

export type ReadItemsOutput<_Schema extends object = any> = unknown;

export const readItems = <Schema extends object = any>(
	_input: ReadItemsInput<Schema>
): Command<ReadItemsOutput<Schema>, DirectusClientConfig, Schema> => {
	return async (_config) => {
		/** Do the fetch call in here */
		return {} as ReadItemsOutput<Schema>;
	};
};
