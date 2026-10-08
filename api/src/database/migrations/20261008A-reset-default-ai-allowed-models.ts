import type { Knex } from 'knex';

// Every default list 20260110A has ever written. A saved value matching one of these was never customized, so it's
// reset to null and follows DEFAULT_ALLOWED_MODELS from @directus/ai from now on.
const PAST_DEFAULTS: Record<string, string[][]> = {
	ai_openai_allowed_models: [
		['gpt-5-nano', 'gpt-5-mini', 'gpt-5'],
		['gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4'],
	],
	ai_anthropic_allowed_models: [
		['claude-haiku-4-5', 'claude-sonnet-4-5'],
		['claude-haiku-4-5', 'claude-sonnet-4-6'],
	],
	ai_google_allowed_models: [['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash']],
};

export async function up(knex: Knex): Promise<void> {
	const settings = await knex('directus_settings')
		.select('id', ...Object.keys(PAST_DEFAULTS))
		.first();

	if (!settings) return;

	const updates: Record<string, null> = {};

	for (const [field, pastDefaults] of Object.entries(PAST_DEFAULTS)) {
		const value = typeof settings[field] === 'string' ? JSON.parse(settings[field]) : settings[field];
		if (!Array.isArray(value)) continue;

		if (pastDefaults.some((models) => isSameSet(models, value))) {
			updates[field] = null;
		}
	}

	if (Object.keys(updates).length === 0) return;

	await knex('directus_settings').update(updates).where('id', settings.id);
}

export async function down(): Promise<void> {
	// Nulls fall back to the defaults in code, so there's nothing to restore
}

function isSameSet(a: string[], b: string[]) {
	return a.length === b.length && a.every((model) => b.includes(model));
}
