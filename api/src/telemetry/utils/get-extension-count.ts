import { type Knex } from 'knex';

export interface ExtensionCount {
	activeTotal: number;
	activeBundles: number;
}

export const getExtensionCount = async (db: Knex): Promise<ExtensionCount> => {
	const counts: ExtensionCount = {
		activeTotal: 0,
		activeBundles: 0,
	};

	const result = <{ count: number | string }[]>(
		await db.count('*', { as: 'count' }).from('directus_extensions').where('enabled', '=', true)
	);

	const bundleResult = <{ count: number | string }[]>await db
		.count('*', { as: 'count' })
		.from('directus_extensions')
		.whereIn('id', await db.distinct('bundle').from('directus_extensions').where('enabled', '=', true))
		.andWhere('enabled', '=', true);

	if (result[0]?.count) {
		counts.activeTotal = Number(result[0].count);
	}

	if (bundleResult[0]?.count) {
		counts.activeBundles = Number(bundleResult[0].count);
	}

	return counts;
};
