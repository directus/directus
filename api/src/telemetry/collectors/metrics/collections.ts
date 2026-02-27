import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { TelemetryReport } from '../../types/report.js';
import { getItemCount } from '../../utils/get-item-count.js';
import { distributionFromCounts, emptyDistribution } from '../../utils/stats.js';

type CollectionMetricsOutput = TelemetryReport['metrics']['collections'] & {
	_totalItems: number;
	_totalFields: number;
};

export async function collectCollectionMetrics(db: Knex, schema: SchemaOverview): Promise<CollectionMetricsOutput> {
	const userCollections = Object.values(schema.collections).filter((c) => !c.collection.startsWith('directus_'));
	const collectionNames = userCollections.map((c) => c.collection);

	if (collectionNames.length === 0) {
		return {
			count: 0,
			shares: emptyDistribution(),
			fields: emptyDistribution(),
			items: emptyDistribution(),
			versioned: { count: 0, items: emptyDistribution() },
			archive_app_filter: { count: 0, items: emptyDistribution() },
			activity: {
				all: { count: 0, items: emptyDistribution() },
				activity: { count: 0, items: emptyDistribution() },
				none: { count: 0, items: emptyDistribution() },
			},
			_totalItems: 0,
			_totalFields: 0,
		};
	}

	const tasks = collectionNames.map((collection) => ({ collection }) as const);

	const [itemCountMap, fieldsByCollection, collectionMeta, sharesPerCollection] = await Promise.all([
		getItemCount(db, tasks),
		db('directus_fields')
			.select('collection')
			.count<{ collection: string; count: string }[]>({ count: '*' })
			.groupBy('collection')
			.whereIn('collection', collectionNames),
		db('directus_collections')
			.select('collection', 'versioning', 'archive_app_filter', 'accountability')
			.whereIn('collection', collectionNames) as Promise<
			Array<{
				collection: string;
				versioning: boolean | number;
				archive_app_filter: boolean | number;
				accountability: 'all' | 'activity' | null;
			}>
		>,
		db('directus_shares')
			.select('collection')
			.count<{ collection: string; count: string }[]>({ count: '*' })
			.groupBy('collection')
			.whereIn('collection', collectionNames),
	]);

	const fieldCountMap = new Map(fieldsByCollection.map((r) => [r.collection, Number(r.count)]));
	const sharesCountMap = new Map(sharesPerCollection.map((r) => [r.collection, Number(r.count)]));

	const metaMap = new Map(
		collectionMeta.map((r) => [
			r.collection,
			{
				versioning: Boolean(r.versioning),
				archive_app_filter: Boolean(r.archive_app_filter),
				accountability: r.accountability,
			},
		]),
	);

	const allItemCounts = collectionNames.map((c) => itemCountMap[c] ?? 0);
	const allFieldCounts = collectionNames.map((c) => fieldCountMap.get(c) ?? 0);
	const allShareCounts = collectionNames.map((c) => sharesCountMap.get(c) ?? 0);

	const versionedNames = collectionNames.filter((c) => metaMap.get(c)?.versioning);
	const versionedItemCounts = versionedNames.map((c) => itemCountMap[c] ?? 0);

	const archiveNames = collectionNames.filter((c) => metaMap.get(c)?.archive_app_filter);
	const archiveItemCounts = archiveNames.map((c) => itemCountMap[c] ?? 0);

	const accountabilityAll = collectionNames.filter((c) => metaMap.get(c)?.accountability === 'all');
	const accountabilityActivity = collectionNames.filter((c) => metaMap.get(c)?.accountability === 'activity');

	const accountabilityNone = collectionNames.filter(
		(c) => metaMap.get(c)?.accountability === null || metaMap.get(c)?.accountability === undefined,
	);

	return {
		count: collectionNames.length,
		shares: distributionFromCounts(allShareCounts),
		fields: distributionFromCounts(allFieldCounts),
		items: distributionFromCounts(allItemCounts),
		versioned: {
			count: versionedNames.length,
			items: distributionFromCounts(versionedItemCounts),
		},
		archive_app_filter: {
			count: archiveNames.length,
			items: distributionFromCounts(archiveItemCounts),
		},
		activity: {
			all: {
				count: accountabilityAll.length,
				items: distributionFromCounts(accountabilityAll.map((c) => itemCountMap[c] ?? 0)),
			},
			activity: {
				count: accountabilityActivity.length,
				items: distributionFromCounts(accountabilityActivity.map((c) => itemCountMap[c] ?? 0)),
			},
			none: {
				count: accountabilityNone.length,
				items: distributionFromCounts(accountabilityNone.map((c) => itemCountMap[c] ?? 0)),
			},
		},
		_totalItems: allItemCounts.reduce((sum, v) => sum + v, 0),
		_totalFields: allFieldCounts.reduce((sum, v) => sum + v, 0),
	};
}
