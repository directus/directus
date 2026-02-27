import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { ExtensionsService } from '../../../services/extensions.js';
import type { ExtensionBreakdown, ExtensionCountBySource, TelemetryReport } from '../../types/report.js';

type ExtensionMetrics = TelemetryReport['metrics']['extensions'];

/** Extension types that have their own breakdown bucket. */
const EXTENSION_TYPES = new Set<string>([
	'display', 'interface', 'module', 'layout', 'panel', 'theme', 'endpoint', 'hook', 'operation', 'bundle',
]);

export async function collectExtensionMetrics(db: Knex, schema: SchemaOverview): Promise<ExtensionMetrics> {
	const extensionsService = new ExtensionsService({ knex: db, schema });
	const extensions = await extensionsService.readAll();

	const active = createEmptyBreakdown();
	const inactive = createEmptyBreakdown();

	for (const extension of extensions) {
		const target = extension.meta.enabled ? active : inactive;
		const source = extension.meta.source;
		const type = extension.schema?.type;

		// Skip extensions without a recognised type so all counters stay consistent
		if (!type || !EXTENSION_TYPES.has(type)) continue;

		const isBundle = type === 'bundle';
		const isBundleChild = extension.bundle !== null;

		// Track type breakdown
		const bucket = target.type[type];
		bucket.count += 1;
		bucket.source[source].count += 1;

		// "bundles" view: count bundles + non-bundled extensions, skip bundle children
		if (!isBundleChild) {
			target.bundles.count += 1;
			target.bundles.source[source].count += 1;
		}

		// "individual" view: count actual extensions, skip bundle parents
		if (!isBundle) {
			target.individual.count += 1;
			target.individual.source[source].count += 1;
		}
	}

	return { active, inactive };
}

/** Create a zeroed-out ExtensionBreakdown structure. */
export function createEmptyBreakdown(): ExtensionBreakdown {
	const emptyCountBySource = (): ExtensionCountBySource => ({
		count: 0,
		source: {
			registry: { count: 0 },
			local: { count: 0 },
			module: { count: 0 },
		},
	});

	return {
		bundles: emptyCountBySource(),
		individual: emptyCountBySource(),
		type: {
			display: emptyCountBySource(),
			interface: emptyCountBySource(),
			module: emptyCountBySource(),
			layout: emptyCountBySource(),
			panel: emptyCountBySource(),
			theme: emptyCountBySource(),
			endpoint: emptyCountBySource(),
			hook: emptyCountBySource(),
			operation: emptyCountBySource(),
			bundle: emptyCountBySource(),
		},
	};
}
