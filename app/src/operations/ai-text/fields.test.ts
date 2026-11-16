import { describe, expect, test, vi } from 'vitest';
import { applyModelLimits, getFields, getModelChoices } from './fields';

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openai', 'openrouter'] } }) }));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => ({
		settings: {
			ai_openai_allowed_models: ['reader', 'text-only'],
			ai_openrouter_models: [{ id: 'openai/gpt-x', name: 'GPT X' }],
		},
	}),
}));

vi.mock('@/ai/models', () => ({
	AI_MODELS: [
		{ provider: 'openai', model: 'reader', name: 'Reader', attachment: true },
		{ provider: 'openai', model: 'text-only', name: 'Text only', attachment: false },
	],
	buildCustomModels: (models: { id: string; name: string }[] | null, provider = 'openai-compatible') =>
		(models ?? []).map((model) => ({ provider, model: model.id, name: model.name, attachment: false })),
	buildCustomModelDefinition: (provider: string, model: string) => ({ provider, model, name: model }),
}));

describe('getModelChoices', () => {
	test('lists only the allowed and saved models', () => {
		expect(getModelChoices().map((choice) => choice.value)).toEqual([
			'openai:reader',
			'openai:text-only',
			'openrouter:openai/gpt-x',
		]);
	});
});

describe('applyModelLimits', () => {
	test("drops files for a model that can't read them", () => {
		expect(applyModelLimits({ model: 'openai:text-only', files: ['a'], prompt: 'x' })).toEqual({
			model: 'openai:text-only',
			prompt: 'x',
		});
	});

	test('keeps files for other models, including ones typed in by hand', () => {
		expect(applyModelLimits({ model: 'openai:reader', files: ['a'] })).toHaveProperty('files');
		expect(applyModelLimits({ model: 'openai:typed-in', files: ['a'] })).toHaveProperty('files');
	});
});

describe('getFields', () => {
	test('hides the files and permissions fields for a model that cannot read files', () => {
		const hidden = getFields({ model: 'openai:text-only' })
			.filter((field) => field.meta?.hidden)
			.map((field) => field.field);

		expect(hidden).toEqual(expect.arrayContaining(['files', 'permissions']));
	});
});
