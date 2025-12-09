import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import type { Knex } from 'knex';

export type TelemetrySettings = {
	project_id: string;
	mcp_enabled: boolean;
	mcp_allow_deletes: boolean;
	mcp_system_prompt_enabled: boolean;
	visual_editor_urls: number;
	ai_openai_api_key: boolean;
	ai_anthropic_api_key: boolean;
	ai_system_prompt: boolean;
};

export type DatabaseSettings = {
	project_id: string;
	mcp_enabled?: boolean;
	mcp_allow_deletes?: boolean;
	mcp_system_prompt_enabled?: boolean;
	visual_editor_urls?: { url: string }[];
	ai_openai_api_key?: string;
	ai_anthropic_api_key?: string;
	ai_system_prompt?: string;
};

export const getSettings = async (db: Knex): Promise<TelemetrySettings> => {
	const settingsService = new SettingsService({
		knex: db,
		schema: await getSchema({ database: db }),
	});

	const settings = (await settingsService.readSingleton({
		fields: [
			'project_id',
			'mcp_enabled',
			'mcp_allow_deletes',
			'mcp_system_prompt_enabled',
			'visual_editor_urls',
			'ai_openai_api_key',
			'ai_anthropic_api_key',
			'ai_system_prompt',
		],
	})) as DatabaseSettings;

	return {
		project_id: settings.project_id,
		mcp_enabled: settings?.mcp_enabled || false,
		mcp_allow_deletes: settings?.mcp_allow_deletes || false,
		mcp_system_prompt_enabled: settings?.mcp_system_prompt_enabled || false,
		visual_editor_urls: settings.visual_editor_urls?.length || 0,
		ai_openai_api_key: settings?.ai_openai_api_key ? true : false,
		ai_anthropic_api_key: settings?.ai_anthropic_api_key ? true : false,
		ai_system_prompt: settings?.ai_system_prompt ? true : false,
	};
};
