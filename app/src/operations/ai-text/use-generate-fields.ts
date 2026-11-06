import type { ProviderType } from '@directus/ai';
import { isAxiosError } from 'axios';
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue';
import type { OutputField } from './output-schema';
import { getAvailableModels, getModelKey } from '@/ai/utils/available-models';
import api from '@/api';
import { i18n } from '@/lang';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';

const FLAT_TYPES = ['string', 'number', 'integer', 'boolean', 'strings', 'numbers'];

/** Rows nest 3 deep here. `/ai/object` needs a strict schema, which can't be recursive for every provider. */
function rowSchema(depth: number): Record<string, unknown> {
	const types = depth > 1 ? [...FLAT_TYPES, 'object', 'objects'] : FLAT_TYPES;

	return {
		type: 'object',
		properties: {
			name: { type: 'string', description: 'snake_case key' },
			type: { type: 'string', enum: types },
			description: { type: 'string', description: 'What goes in this value, in one short sentence' },
			required: { type: 'boolean', description: 'False only when the value may be missing from the source' },
			choices: {
				type: 'array',
				items: { type: 'string' },
				description: 'Allowed values for string fields, else empty',
			},
			...(depth > 1
				? {
						fields: {
							type: 'array',
							items: rowSchema(depth - 1),
							description: 'Only for object and objects, else empty',
						},
					}
				: {}),
		},
		required: ['name', 'type', 'description', 'required', 'choices', ...(depth > 1 ? ['fields'] : [])],
	};
}

const OUTPUT_SCHEMA = {
	type: 'object',
	properties: { fields: { type: 'array', items: rowSchema(3) } },
	required: ['fields'],
};

/** Asks an AI model to turn a plain description into output fields, through the same `/ai/object` endpoint as AI translations. */
export function useGenerateFields(stepModel: MaybeRefOrGetter<string | undefined>) {
	const settingsStore = useSettingsStore();
	const serverStore = useServerStore();
	const loading = ref(false);

	/** The step's own model when it's allowed for app AI features, otherwise the first one that is. */
	const model = computed(() => {
		const providers = (serverStore.info.ai_providers ?? []) as ProviderType[];
		const available = getAvailableModels(settingsStore.settings, providers);
		return available.find((m) => getModelKey(m) === toValue(stepModel)) ?? available[0] ?? null;
	});

	async function generate(description: string, signal?: AbortSignal): Promise<OutputField[]> {
		if (!model.value) throw new Error('No AI model available');

		loading.value = true;

		try {
			const body = {
				provider: model.value.provider,
				model: model.value.model,
				prompt: getPrompt(description),
				outputSchema: OUTPUT_SCHEMA,
			};

			// The reply streams in, so it's read as text: a provider error partway through leaves JSON that doesn't parse
			const response = await api.post<string>('/ai/object', body, { signal, responseType: 'text' });

			return clean(parseReply(response.data));
		} catch (error) {
			if (!isAxiosError(error) || signal?.aborted) throw error;
			const status = error.response?.statusText || `HTTP ${error.response?.status}`;
			throw new Error(readErrorMessage(error.response?.data, status), { cause: error });
		} finally {
			loading.value = false;
		}
	}

	return { model, loading, generate };
}

function parseReply(text: string): OutputField[] {
	const fields = (parseJson(text) as { fields?: unknown } | null)?.fields;
	if (!Array.isArray(fields)) throw new Error(i18n.global.t('operations.ai-text.generate_incomplete'));
	return fields;
}

/** The API's error message, or a generic one when the body isn't a Directus error, like a proxy's HTML page. */
function readErrorMessage(data: unknown, status: string): string {
	const body = typeof data === 'string' ? parseJson(data) : data;
	const message = (body as { errors?: { message?: unknown }[] } | null)?.errors?.[0]?.message;
	return typeof message === 'string' ? message : i18n.global.t('operations.ai-text.generate_failed', { status });
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

/** Drops the empty `choices` and `fields` lists the strict schema makes the model send. */
function clean(fields: OutputField[]): OutputField[] {
	return fields.map(({ choices, fields: nested, ...field }) => ({
		...field,
		...(choices?.length ? { choices } : {}),
		...(nested?.length ? { fields: clean(nested) } : {}),
	}));
}

function getPrompt(description: string) {
	return `Design the output fields for an AI step in an automation flow. Later steps read the step's result by key.

The user describes what they want back:
"""
${description}
"""

Return exactly the values they describe, and nothing else. Types:
- string: text. Add choices when the user lists allowed values, or only a few values make sense.
- number
- integer: a whole number, like a count or a position in pixels
- boolean
- strings: a list of text
- numbers: a list of numbers
- object: named values, described by "fields"
- objects: a list of objects, described by "fields"

Use snake_case names. Set required to false only when the user says a value may be missing.`;
}
