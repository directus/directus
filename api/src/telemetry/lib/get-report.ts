import { getDatabase } from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import type { TelemetryReport } from '../types/report.js';

/**
 * Create a telemetry report about the anonymous usage of the current installation
 *
 * @param trigger What triggered this report ("startup" or "scheduled").
 */
export const getReport = async (trigger: TelemetryReport['_trigger'] = 'scheduled'): Promise<TelemetryReport> => {
	const db = getDatabase();
	const schema = await getSchema({ database: db });

	const [project, config, features, metrics] = await Promise.all([
		collectProject(db, schema),
		collectConfig(db),
		collectFeatures(db, schema),
		collectMetrics(db, schema),
	]);

	return {
		_version: 1,
		_timestamp: new Date().toISOString(),
		_trigger: trigger,
		project,
		config,
		features,
		metrics,
	};
};
