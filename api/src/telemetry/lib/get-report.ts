import { getDatabase } from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import type { TelemetryMeta, TelemetryReport } from '../types/report.js';

/**
 * Create a telemetry report about the anonymous usage of the current installation
 *
 * @param trigger What triggered this report ("startup" or "scheduled").
 */
export const getReport = async (
	trigger: TelemetryMeta['trigger'] = 'scheduled',
): Promise<TelemetryReport> => {
	const db = getDatabase();
	const schema = await getSchema({ database: db });

	const [project, config, features, metrics] = await Promise.all([
		collectProject(db, schema),
		collectConfig(db),
		collectFeatures(db, schema),
		collectMetrics(db, schema),
	]);

	return {
		project,
		meta: {
			version: 1,
			timestamp: new Date().toISOString(),
			trigger,
		},
		config,
		features,
		metrics,
	};
};
