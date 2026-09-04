import type { SchemaOverview } from '@directus/types';
import { version } from 'directus/version';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';
import type { TelemetryReport } from '../types/report.js';
import { deriveCreatedAtFromUuid } from '../utils/derive-created-at-from-uuid.js';
import { getTemplatesApplied } from '../utils/get-templates-applied.js';

type ProjectInfo = TelemetryReport['project'];

export async function collectProject(db: Knex, schema: SchemaOverview): Promise<ProjectInfo> {
	const settingsService = new SettingsService({
		knex: db,
		schema,
	});

	const settings = (await settingsService.readSingleton({ fields: ['project_id'] })) as { project_id: string };

	return {
		id: settings.project_id,
		created_at: deriveCreatedAtFromUuid(settings.project_id)!,
		version,
		templates_applied: getTemplatesApplied(schema),
	};
}
