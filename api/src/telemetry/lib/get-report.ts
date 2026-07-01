import { getSystemCache, setSystemCache } from '../../cache.js';
import { getDatabase } from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import type { TelemetryReport } from '../types/report.js';

const CACHE_KEY = 'telemetry-report';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Create a telemetry report about the anonymous usage of the current installation.
 * The expensive data collection is cached for 15 minutes to avoid redundant queries.
 *
 * @param trigger What triggered this report ("startup" or "scheduled").
 */
export const getReport = async (trigger: TelemetryReport['trigger'] = 'scheduled'): Promise<TelemetryReport> => {
	const cached = await getSystemCache(CACHE_KEY);

	if (cached) {
		return { ...cached, trigger } as TelemetryReport;
	}

	const db = getDatabase();
	const schema = await getSchema({ database: db });

	const [project, config, features, metrics] = await Promise.all([
		collectProject(db, schema),
		collectConfig(db),
		collectFeatures(db, schema),
		collectMetrics(db, schema),
	]);

	const report: TelemetryReport = {
		event: 'directus.telemetry.ping.v2',
		revision: 1,
		timestamp: new Date().toISOString(),
		trigger,
		project,
		config,
		features,
		metrics,
	};

	await setSystemCache(CACHE_KEY, report, CACHE_TTL_MS);

	return report;
};
