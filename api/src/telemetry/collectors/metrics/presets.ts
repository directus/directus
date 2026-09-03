import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { PresetMetrics } from '../../types/report.js';
import { serviceCount } from '../../utils/service-count.js';

export async function collectPresetMetrics(db: Knex, schema: SchemaOverview): Promise<PresetMetrics> {
	const [count, bookmarks] = await Promise.all([
		serviceCount(db, schema, 'directus_presets'),
		// A preset with a bookmark name is a saved bookmark; without one it is a default view.
		db('directus_presets').whereNotNull('bookmark').count<Array<{ count: string }>>({ count: '*' }),
	]);

	return { count, bookmarks: { count: Number(bookmarks[0]?.count ?? 0) } };
}
