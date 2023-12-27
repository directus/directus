import { type Knex } from 'knex';
import pLimit from 'p-limit';

export interface CollectionCount {
	collection: string;
	count: number;
}

/**
 * Get the item count of the given collection in the given database
 * @param db Knex instance to count against
 * @param collection Table to count rows in
 * @returns Collection name and count
 */
export const countCollection = async (db: Knex, collection: string): Promise<CollectionCount> => {
	const count = await db.count('*', { as: 'count' }).from(collection).first();
	return { collection, count: Number(count?.['count'] ?? 0) };
};

/**
 * Merge the given collection count in the object accumulator
 * Intended for use with .reduce()
 * @param acc Accumulator
 * @param value Current collection count object in array
 * @returns Updated accumulator
 */
export const mergeResults = (acc: Record<string, number>, value: CollectionCount) => {
	acc[value.collection] = value.count;
	return acc;
};

/**
 * Get an object of item counts for the given collections
 * @param db Database instance to get counts in
 * @param collections Array of table names to get count from
 */
export const getItemCount = async <T extends readonly string[]>(db: Knex, collections: T) => {
	// Counts can be a little heavy if the table is very large, so we'll only ever execute 3 of these
	// queries simultaneously to not overload the database
	const limit = pLimit(3);

	const calls = collections.map((collection) => limit(countCollection, db, collection));

	const results = await Promise.all(calls);

	return <Record<T[number], number>>results.reduce(mergeResults, {});
};
