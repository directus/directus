import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import Options from './options.vue';

const { generate } = vi.hoisted(() => ({
	generate: vi.fn<(description: string, signal?: AbortSignal) => Promise<unknown[]>>(),
}));

vi.mock('./use-generate-fields', async () => {
	const { ref } = await import('vue');
	return { useGenerateFields: () => ({ model: ref({ name: 'A' }), loading: ref(false), generate }) };
});

vi.mock('@/stores/server', () => ({ useServerStore: () => ({ info: { ai_providers: ['openai'] } }) }));
vi.mock('@/stores/settings', () => ({ useSettingsStore: () => ({ settings: {} }) }));
vi.mock('@/ai/models', () => ({
	AI_MODELS: [],
	buildCustomModels: () => [],
	buildCustomModelDefinition: (provider: string, model: string) => ({ provider, model, name: model }),
}));

const i18n = createI18n({ legacy: false, missingWarn: false, fallbackWarn: false });

function mountOptions(value: Record<string, unknown>) {
	return mount(Options, {
		props: { value },
		global: {
			plugins: [i18n],
			stubs: { VForm: true, VDialog: true, DrawerFiles: true, VNotice: true, VButton: true, VIcon: true },
			directives: { tooltip: {}, md: {} },
		},
	});
}

/** The row editor is the VForm whose only field is the `fields` list */
const rowForm = (wrapper: ReturnType<typeof mountOptions>) =>
	wrapper.findAllComponents({ name: 'VForm' }).find((form) => form.props('fields')?.[0]?.field === 'fields');

describe('AI Text options', () => {
	test('keeps the row editor after adding the first field to an empty schema', async () => {
		const wrapper = mountOptions({ output: 'object' });

		rowForm(wrapper)!.vm.$emit('update:model-value', { fields: [{ type: 'string', required: true }] });

		const saved = wrapper.emitted('input')!.at(-1)![0] as Record<string, unknown>;
		expect(saved['schema']).toEqual({ type: 'object', properties: {}, required: [] });

		await wrapper.setProps({ value: saved });

		expect(rowForm(wrapper)).toBeTruthy();
		expect(rowForm(wrapper)!.props('modelValue')).toEqual({ fields: [{ type: 'string', required: true }] });
	});

	test('start over clears what starting points fill in, and keeps the rest', () => {
		const wrapper = mountOptions({
			model: 'openai:gpt-a',
			prompt: 'Summarize [your content]',
			output: 'object',
			schema: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
			system: 'Be brief',
			maxOutputTokens: 400,
		});

		wrapper.findComponent({ name: 'AiStartingPoints' }).vm.$emit('startOver');

		expect(wrapper.emitted('input')!.at(-1)![0]).toEqual({
			model: 'openai:gpt-a',
			system: 'Be brief',
			maxOutputTokens: 400,
		});
	});

	test('cancels a running generate request when the editor closes', async () => {
		let signal: AbortSignal | undefined;

		generate.mockImplementation((_, requestSignal) => {
			signal = requestSignal;
			return new Promise(() => {});
		});

		const wrapper = mountOptions({ output: 'object' });
		(wrapper.vm as any).description = 'Alt text';
		(wrapper.vm as any).runGenerate();

		wrapper.unmount();

		expect(signal?.aborted).toBe(true);
	});
});
