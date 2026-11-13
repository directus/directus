import { describe, expect, test, vi } from 'vitest';
import { applyModelLimits, getAspectRatioChoices, getFields } from './fields';

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openai', 'google'] } }) }));

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
});

describe('getFields', () => {
	test('hides quality and transparency for Google models', () => {
		const hidden = getFields({ model: 'google:gemini-3-pro-image' })
			.filter((field) => field.meta?.hidden)
			.map((field) => field.field);

		expect(hidden).toEqual(['quality', 'transparent']);
	});
});
