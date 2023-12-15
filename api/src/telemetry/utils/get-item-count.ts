import { type Knex } from 'knex';
import pLimit from 'p-limit';

/**
 * Get an object of item counts for the given collections
 */
export const getItemCount = async <T extends readonly string[]>(db: Knex, collections: T) => {
	// Counts can be a little heavy if the table is very large, so we'll only ever execute 5 of these
	// queries simultaneously to not overload the database
	const limit = pLimit(5);

	const calls = collections.map((collection) =>
		limit(async (collection) => {
			const count = await db(collection).count('*').as('count').first();
			return { [collection]: Number(count?.['count'] ?? 0) };
		}, collection),
	);

	return (await Promise.all(calls)).reduce((acc, rec) => ({ ...acc, ...rec }), {}) as Record<T[number], number>;
};
