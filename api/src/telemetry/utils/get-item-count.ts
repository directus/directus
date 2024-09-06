import { type Knex } from 'knex';
import pLimit from 'p-limit';

export interface CollectionCount {
	collection: string;
	count: number;
}

export interface CollectionCountTask {
	collection: string;
	where?: readonly [string, string, string | boolean | number];
}

/**
 * Get the item count of the given task in the given database
 * @param db Knex instance to count against
 * @param task Task to count rows for
 * @returns Collection name and count
 */
export const countCollection = async (db: Knex, task: CollectionCountTask): Promise<CollectionCount> => {
	const query = db.count('*', { as: 'count' }).from(task.collection);

	if (task.where) {
		query.where(...task.where);
	}

	const count = await query.first();
	return { collection: task.collection, count: Number(count?.['count'] ?? 0) };
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
 * Get an object of item counts for the given tasks
 * @param db Database instance to get counts in
 * @param tasks Array of tasks to get count for
 */
export const getItemCount = async <T extends readonly CollectionCountTask[]>(db: Knex, tasks: T) => {
	// Counts can be a little heavy if the table is very large, so we'll only ever execute 3 of these
	// queries simultaneously to not overload the database
	const limit = pLimit(3);

	const calls = tasks.map((task) => limit(countCollection, db, task));

	const results = await Promise.all(calls);

	return <Record<T[number]['collection'], number>>results.reduce(mergeResults, {});
};
