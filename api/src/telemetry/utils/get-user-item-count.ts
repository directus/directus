import { isSystemCollection } from '@directus/system-data';
import { type Knex } from 'knex';
import { getSchema } from '../../utils/get-schema.js';
import { getItemCount } from './get-item-count.js';

export interface UserItemCount {
	collections: number;
	items: number;
}

/**
 * Sum all passed values together. Meant to be used with .reduce()
 */
export const sum = (acc: number, val: number) => (acc += val);

/**
 * Count all the items in the non-system tables
 */
export const getUserItemCount = async (db: Knex): Promise<UserItemCount> => {
	const schema = await getSchema({ database: db });

	const userCollections = Object.keys(schema.collections)
		.filter((collection) => isSystemCollection(collection) === false)
		.map((collection) => ({ collection }));

	const counts = await getItemCount(db, userCollections);

	const collections = userCollections.length;
	const items = Object.values(counts).reduce(sum, 0);

	return { collections, items };
};
