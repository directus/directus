import type { SchemaOverview, Settings } from '@directus/types';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import type { AISettings } from './types.js';

export const AI_SETTINGS_FIELDS = [
	'ai_openai_api_key',
	'ai_anthropic_api_key',
	'ai_google_api_key',
	'ai_openrouter_api_key',
	'ai_openai_compatible_api_key',
	'ai_openai_compatible_base_url',
	'ai_openai_compatible_name',
	'ai_openai_compatible_models',
	'ai_openai_compatible_headers',
	'ai_openai_allowed_models',
	'ai_anthropic_allowed_models',
	'ai_google_allowed_models',
	'ai_openrouter_models',
	'ai_system_prompt',
] as const satisfies readonly (keyof Settings)[];

/**
 * Reads AI settings as the system, so encrypted API keys come back decrypted. Never send the result to a client.
 * Flow steps pass their own database handle so the read happens inside the flow's transaction.
 */
export async function getAISettings(context: { knex?: Knex; schema?: SchemaOverview } = {}): Promise<AISettings> {
	const service = new SettingsService({
		schema: context.schema ?? (await getSchema(context.knex && { database: context.knex })),
		knex: context.knex,
		accountability: null,
	});

	return service.readSingleton({ fields: [...AI_SETTINGS_FIELDS] }) as Promise<AISettings>;
}
