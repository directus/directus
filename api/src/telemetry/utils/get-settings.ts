import type { Knex } from 'knex';
import { toBoolean } from '@directus/utils';

type TelemetrySettings = {
	project_id: string;
	mcp_enabled: boolean;
	mcp_allow_deletes: boolean;
	mcp_system_prompt_enabled: boolean;
	visual_editor_urls: number;
	accepted_terms: boolean;
};

export const getSettings = async (db: Knex): Promise<TelemetrySettings> => {
	const settings = await db
		.select(
			'project_id',
			'mcp_enabled',
			'mcp_allow_deletes',
			'mcp_system_prompt_enabled',
			'visual_editor_urls',
			'accepted_terms',
		)
		.from('directus_settings')
		.first();

	return {
		project_id: settings.project_id,
		mcp_enabled: toBoolean(settings?.mcp_enabled),
		mcp_allow_deletes: toBoolean(settings?.mcp_allow_deletes),
		mcp_system_prompt_enabled: toBoolean(settings?.mcp_system_prompt_enabled),
		visual_editor_urls: settings.visual_editor_urls ? JSON.parse(settings.visual_editor_urls).length : 0,
		accepted_terms: toBoolean(settings?.accepted_terms),
	};
};
