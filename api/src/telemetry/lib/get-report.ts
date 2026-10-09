import { getSystemCache, setSystemCache } from '../../cache.js';
import { getDatabase } from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectApiRequestMetrics } from '../collectors/metrics/api-requests.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import type { TelemetryReport } from '../types/report.js';
import { safeCollect } from '../utils/safe-collect.js';

const CACHE_KEY = 'telemetry-report';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

type CachedSections = Pick<TelemetryReport, 'project' | 'config' | 'features'> & {
	metrics: Omit<TelemetryReport['metrics'], 'api_requests'>;
};

/**
 * Create a telemetry report about the anonymous usage of the current installation.
 * The expensive data collection is cached for 15 minutes to avoid redundant queries.
 *
 * @param trigger What triggered this report ("startup" or "scheduled").
 */
export const getReport = async (trigger: TelemetryReport['trigger'] = 'scheduled'): Promise<TelemetryReport> => {
	// Reading the API request counters resets them, so they're collected per report rather than cached.
	const [sections, apiRequests] = await Promise.all([
		getCachedSections(),
		safeCollect('metrics.api_requests', () => collectApiRequestMetrics()),
	]);

	return {
		event: 'directus.telemetry.ping.v2',
		revision: 1,
		timestamp: new Date().toISOString(),
		trigger,
		project: sections.project,
		config: sections.config,
		features: sections.features,
		metrics: { ...sections.metrics, api_requests: apiRequests },
	};
};

const getCachedSections = async (): Promise<CachedSections> => {
	const cached = (await getSystemCache(CACHE_KEY)) as CachedSections | undefined;

	if (cached) return cached;

	const db = getDatabase();
	const schema = await getSchema({ database: db });

	// Project holds the identity the report is keyed on, so it alone is allowed to fail the report.
	const [project, config, features, metrics] = await Promise.all([
		collectProject(db, schema),
		collectConfig(db),
		safeCollect('features', () => collectFeatures(db, schema)),
		collectMetrics(db, schema),
	]);

	const sections: CachedSections = { project, config, features, metrics };

	await setSystemCache(CACHE_KEY, sections, CACHE_TTL_MS);

	return sections;
};
