import { type Knex } from 'knex';

export interface ExtensionCount {
	total: number;
	bundles: number;
}

export const getExtensionCount = async (db: Knex): Promise<ExtensionCount> => {
	const counts: ExtensionCount = {
		total: 0,
		bundles: 0,
	};

	const result = <{ count: number | string; countBundles: number | string }[]>(
		await db
			.count('*', { as: 'count' })
			.countDistinct('bundle', { as: 'countBundles' })
			.from('directus_extensions')
			.where('enabled', '=', true)
	);

	if (result[0]?.count) {
		counts.total = Number(result[0].count);
	}

	if (result[0]?.countBundles) {
		counts.bundles = Number(result[0].countBundles);
	}

	return counts;
};
