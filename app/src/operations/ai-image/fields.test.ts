import { describe, expect, test, vi } from 'vitest';
import { applyModelLimits, getAspectRatioChoices, getFields, getImageModelChoices } from './fields';

const serverInfo = vi.hoisted(() => ({ ai_providers: ['openai', 'google', 'openrouter'] }));

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: serverInfo }) }));

describe('applyModelLimits', () => {
	test('snaps the ratio to the closest one the model supports', () => {
		expect(applyModelLimits({ model: 'openai:gpt-image-2', aspectRatio: '8:1' }).aspectRatio).toBe('21:9');
	});

	test('leaves a {{ }} ratio for the API', () => {
		const ratio = '{{ $trigger.ratio }}';
		expect(applyModelLimits({ model: 'openai:gpt-image-2', aspectRatio: ratio }).aspectRatio).toBe(ratio);
	});

	test('drops transparency only for models known not to have it', () => {
		expect(applyModelLimits({ model: 'openai:gpt-image-2', transparent: true })).not.toHaveProperty('transparent');

		expect(applyModelLimits({ model: 'openai:gpt-image-2.6-sunburst', transparent: true })).toHaveProperty(
			'transparent',
		);

		expect(applyModelLimits({ transparent: true })).toHaveProperty('transparent');
		expect(applyModelLimits({ model: 'openai:gpt-image-typed-in', transparent: true })).toHaveProperty('transparent');
	});

	test('drops transparency for every OpenRouter model', () => {
		expect(applyModelLimits({ model: 'openrouter:openai/gpt-image-2.6-flare', transparent: true })).not.toHaveProperty(
			'transparent',
		);
	});
});

describe('getAspectRatioChoices', () => {
	test('offers matching the reference image only when there are references', () => {
		const values = (references: boolean) =>
			getAspectRatioChoices('google:gemini-3-pro-image', references).map((choice) => choice.value);

		expect(values(true)[0]).toBe('reference');
		expect(values(false)).not.toContain('reference');
	});

	test("uses Google's ratios for a model that isn't an image provider", () => {
		expect(getAspectRatioChoices('anthropic:x', false).map((choice) => choice.value)).toContain('8:1');
	});

	test('narrows an OpenRouter model to the ratios OpenRouter lists for it', () => {
		const openRouterModels = [
			{ id: 'acme/narrow', name: 'Narrow', aspectRatios: ['1:1', '16:9', '1:3'] as `${number}:${number}`[] },
		];

		const values = (model: string) =>
			getAspectRatioChoices(model, false, openRouterModels).map((choice) => choice.value);

		expect(values('openrouter:acme/narrow')).toEqual(['1:1', '16:9']);
		expect(values('openrouter:acme/typed-in')).toHaveLength(10);
	});

	test('snaps the saved ratio to one the OpenRouter model lists', () => {
		const openRouterModels = [
			{ id: 'acme/narrow', name: 'Narrow', aspectRatios: ['1:1', '16:9'] as `${number}:${number}`[] },
		];

		expect(
			applyModelLimits({ model: 'openrouter:acme/narrow', aspectRatio: '21:9' }, openRouterModels).aspectRatio,
		).toBe('16:9');
	});
});

describe('getFields', () => {
	test('hides quality and transparency for Google models', () => {
		const hidden = getFields({ model: 'google:gemini-3-pro-image' })
			.filter((field) => field.meta?.hidden)
			.map((field) => field.field);

		expect(hidden).toEqual(['quality', 'transparent']);
	});

	test.each([
		['listed', [{ id: 'black-forest-labs/flux-3-image', name: 'FLUX 3 Image' }]],
		['typed-in', []],
	])('hides quality and transparency for a %s OpenRouter model', (_, openRouterModels) => {
		const hidden = getFields({ model: 'openrouter:black-forest-labs/flux-3-image' }, openRouterModels)
			.filter((field) => field.meta?.hidden)
			.map((field) => field.field);

		expect(hidden).toEqual(['quality', 'transparent']);
	});

	test('keeps the model note when OpenRouter is the only image provider and its list is empty', () => {
		serverInfo.ai_providers = ['openrouter'];
		const model = getFields({}).find((field) => field.field === 'model');
		serverInfo.ai_providers = ['openai', 'google', 'openrouter'];

		expect(model?.meta?.note).toBe('$t:operations.ai-image.model_note');
	});
});

describe('getImageModelChoices', () => {
	test('has no built-in OpenRouter models', () => {
		expect(getImageModelChoices().filter((choice) => choice.provider === 'openrouter')).toEqual([]);
	});

	test('lists the OpenRouter models it is given next to the built-in ones', () => {
		const choices = getImageModelChoices([{ id: 'black-forest-labs/flux-3-image', name: 'FLUX 3 Image' }]);

		expect(choices).toContainEqual(
			expect.objectContaining({ value: 'openrouter:black-forest-labs/flux-3-image', text: 'FLUX 3 Image' }),
		);

		expect(choices.map((choice) => choice.value)).toContain('google:gemini-3-pro-image');
	});
});
