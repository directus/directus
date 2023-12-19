import { type Knex } from 'knex';
import { getSchema } from '../../utils/get-schema.js';
import { getItemCount } from './get-item-count.js';

export interface UserItemCount {
	collections: number;
	items: number;
}

/**
 * Count all the items in the non-system tables
 */
export const getUserItemCount = async (db: Knex): Promise<UserItemCount> => {
	const schema = await getSchema({ database: db });

	const userCollections = Object.keys(schema.collections).filter(
		(collection) => collection.startsWith('directus_') === false,
	);

	const counts = await getItemCount(db, userCollections);

	const items = Object.values(counts).reduce((acc, val) => (acc += val), 0);
	const collections = userCollections.length;

	return { collections, items };
};
