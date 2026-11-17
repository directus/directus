import { flushPromises, shallowMount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import Options from './options.vue';

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openrouter'] } }) }));

vi.mock('@/ai/utils/openrouter-models', () => ({
	fetchOpenRouterModels: () => Promise.resolve([{ id: 'acme/narrow', name: 'Narrow', aspectRatios: ['1:1', '3:2'] }]),
}));

const i18n = createI18n({ legacy: false, missingWarn: false, fallbackWarn: false });

test('snaps a saved ratio the model does not list once the OpenRouter list loads', async () => {
	const wrapper = shallowMount(Options, {
		props: { value: { model: 'openrouter:acme/narrow', prompt: 'A cat', aspectRatio: '16:9' } },
		global: { plugins: [i18n] },
	});

	await flushPromises();

	expect(wrapper.emitted('input')).toEqual([
		[{ model: 'openrouter:acme/narrow', prompt: 'A cat', aspectRatio: '3:2' }],
	]);
});

test('leaves a ratio the model lists alone', async () => {
	const wrapper = shallowMount(Options, {
		props: { value: { model: 'openrouter:acme/narrow', aspectRatio: '1:1' } },
		global: { plugins: [i18n] },
	});

	await flushPromises();

	expect(wrapper.emitted('input')).toBeUndefined();
});
