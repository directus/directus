import { describe, expect, test, vi } from 'vitest';
import { applyModelLimits, getFields } from './fields';

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openai'] } }) }));
vi.mock('@/stores/settings', () => ({ useSettingsStore: () => ({ settings: {} }) }));

vi.mock('@/ai/models', () => ({
	AI_MODELS: [
		{ provider: 'openai', model: 'reader', name: 'Reader', attachment: true },
		{ provider: 'openai', model: 'text-only', name: 'Text only', attachment: false },
	],
	buildCustomModels: () => [],
}));

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
