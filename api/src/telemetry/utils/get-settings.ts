import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import type { Knex } from 'knex';

export type TelemetrySettings = {
	project_id: string;
	mcp_enabled: boolean;
	mcp_allow_deletes: boolean;
	mcp_system_prompt_enabled: boolean;
	visual_editor_urls: number;
};

type DatabaseSettings = {
	project_id: string;
	mcp_enabled?: boolean;
	mcp_allow_deletes?: boolean;
	mcp_system_prompt_enabled?: boolean;
	visual_editor_urls?: { url: string }[];
};

export const getSettings = async (db: Knex): Promise<TelemetrySettings> => {
	const settingsService = new SettingsService({
		knex: db,
		schema: await getSchema({ database: db }),
	});

	const settings = (await settingsService.readSingleton({
		fields: ['project_id', 'mcp_enabled', 'mcp_allow_deletes', 'mcp_system_prompt_enabled', 'visual_editor_urls'],
	})) as DatabaseSettings;

	return {
		project_id: settings.project_id,
		mcp_enabled: settings?.mcp_enabled || false,
		mcp_allow_deletes: settings?.mcp_allow_deletes || false,
		mcp_system_prompt_enabled: settings?.mcp_system_prompt_enabled || false,
		visual_editor_urls: settings.visual_editor_urls?.length || 0,
	};
};
