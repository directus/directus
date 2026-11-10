import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { CUSTOM_LLM_FIELDS } from '../../constants.js';
import { getEntitlementManager } from '../../license/index.js';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import type { AISettings } from './types.js';

const AI_SETTINGS_FIELDS = [
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
] as const satisfies readonly (keyof AISettings)[];

/**
 * Reads AI settings as the system, so encrypted API keys come back decrypted. Never send the result to a client.
 * Flow steps pass their own database handle so the read happens inside the flow's transaction.
 */
export async function getAISettings(context: { knex?: Knex; schema?: SchemaOverview } = {}): Promise<AISettings> {
	const service = new SettingsService({
		schema: context.schema ?? (await getSchema(context.knex ? { database: context.knex } : undefined)),
		...(context.knex ? { knex: context.knex } : {}),
		accountability: null,
	});

	// The Settings type masks API keys, but reading as the system returns them decrypted.
	const stored = (await service.readSingleton({ fields: [...AI_SETTINGS_FIELDS] })) as Partial<AISettings>;

	const settings = Object.fromEntries(
		AI_SETTINGS_FIELDS.map((field) => [field, stored[field] ?? null]),
	) as unknown as AISettings;

	// Reading as the system skips the settings service's license masking, so apply it here.
	if (!getEntitlementManager().isEntitled('custom_llms_enabled')) {
		for (const field of CUSTOM_LLM_FIELDS) {
			settings[field] = null;
		}
	}

	return settings;
}
