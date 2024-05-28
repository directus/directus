import { type Knex } from 'knex';

export interface ExtensionCount {
	/**
	 * Total count of enabled extensions excluding Bundle-Parents,
	 * meaning a Bundle extensions with one extension inside of it counts as one.
	 */
	totalEnabled: number;
}

export const getExtensionCount = async (db: Knex): Promise<ExtensionCount> => {
	const queryEnabled = await db
		.count<{ count?: string | number }>('*', { as: 'count' })
		.from('directus_extensions')
		.where('enabled', '=', true)
		.first();

	const countEnabledTotal = queryEnabled?.count ? Number(queryEnabled.count) : 0;

	const queryBundles = await db
		.count<{ count?: string | number }>('*', { as: 'count' })
		.from('directus_extensions')
		.whereIn('id', db.distinct('bundle').from('directus_extensions'))
		.andWhere('enabled', '=', true)
		.first();

	const countEnabledBundles = queryBundles?.count ? Number(queryBundles.count) : 0;

	return {
		totalEnabled: countEnabledTotal - countEnabledBundles,
	};
};
