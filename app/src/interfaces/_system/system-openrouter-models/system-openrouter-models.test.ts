import type { OpenAICompatibleModel } from '@directus/ai';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import SystemOpenRouterModels from './system-openrouter-models.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { fetchOpenRouterModels } from '@/ai/utils/openrouter-models';
import VInput from '@/components/v-input.vue';
import SelectListItem from '@/components/v-select/select-list-item.vue';
import { i18n } from '@/lang';

vi.mock('@/ai/utils/openrouter-models', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/ai/utils/openrouter-models')>()),
	fetchOpenRouterModels: vi.fn(),
}));

const VMenuStub = defineComponent({
	props: { modelValue: Boolean, disabled: Boolean },
	emits: ['update:modelValue'],
	template: `
		<div>
			<slot name="activator" :toggle="() => $emit('update:modelValue', !modelValue)" :active="modelValue" />
			<div v-if="modelValue" class="menu-content"><slot /></div>
		</div>
	`,
});

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: {
		VMenu: VMenuStub,
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
		VIcon: true,
	},
	directives: { tooltip: () => {} },
};

const luna = { id: 'openai/gpt-6-luna', name: 'OpenAI: GPT-6 Luna', context: 1_050_000, output: 128_000 };

const haiku = {
	id: 'anthropic/claude-haiku-4.5',
	name: 'Anthropic: Claude Haiku 4.5',
	context: 200_000,
	output: 64_000,
};

const savedLuna = { id: 'openai/gpt-6-luna', name: 'GPT-6 Luna', context: 1_050_000, output: 128_000 };
const savedHaiku = { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', context: 200_000, output: 64_000 };
const privateModel = { id: 'acme/private-model', name: 'Private Model' };

function mountPicker(value: OpenAICompatibleModel[] | null = null) {
	return mount(SystemOpenRouterModels, { props: { value }, global });
}

async function openMenu(wrapper: ReturnType<typeof mountPicker>) {
	await wrapper.findComponent(VInput).vm.$emit('click');
	await flushPromises();
}

function searchInput(wrapper: ReturnType<typeof mountPicker>) {
	return wrapper.findAllComponents(VInput).find((input) => input.props('placeholder') === 'Search')!;
}

function rowWithText(wrapper: ReturnType<typeof mountPicker>, text: string) {
	return wrapper.findAll('.v-list-item').find((item) => item.text().includes(text))!;
}

function listedItems(wrapper: ReturnType<typeof mountPicker>) {
	return wrapper.findAllComponents(SelectListItem).map((item) => item.props('item'));
}

beforeEach(() => {
	vi.mocked(fetchOpenRouterModels).mockResolvedValue([luna, haiku]);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('system-openrouter-models', () => {
	test('lists the catalog when opened', async () => {
		const wrapper = mountPicker();
		await openMenu(wrapper);

		expect(fetchOpenRouterModels).toHaveBeenCalledOnce();

		expect(listedItems(wrapper)).toEqual([
			{ text: 'OpenAI: GPT-6 Luna', value: 'openai/gpt-6-luna' },
			{ text: 'Anthropic: Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5' },
		]);
	});

	test('saves picked models with catalog details, and null when everything is removed', async () => {
		const wrapper = mountPicker([savedLuna]);
		await openMenu(wrapper);

		await wrapper
			.findAllComponents(SelectListItem)[1]!
			.vm.$emit('update:modelValue', ['openai/gpt-6-luna', 'anthropic/claude-haiku-4.5']);

		await wrapper.findAllComponents(SelectListItem)[0]!.vm.$emit('update:modelValue', null);

		expect(wrapper.emitted('input')).toEqual([[[savedLuna, savedHaiku]], [null]]);
	});

	test('filters by id or name, ignoring case', async () => {
		const wrapper = mountPicker();
		await openMenu(wrapper);

		await searchInput(wrapper).vm.$emit('update:modelValue', 'Claude');
		expect(listedItems(wrapper).map((item) => item.value)).toEqual(['anthropic/claude-haiku-4.5']);

		await searchInput(wrapper).vm.$emit('update:modelValue', 'openai/');
		expect(listedItems(wrapper).map((item) => item.value)).toEqual(['openai/gpt-6-luna']);
	});

	test('adds a typed model id that is not in the catalog', async () => {
		const wrapper = mountPicker([savedLuna]);
		await openMenu(wrapper);

		await searchInput(wrapper).vm.$emit('update:modelValue', 'acme/private-model');
		await rowWithText(wrapper, 'Add "acme/private-model"').trigger('click');

		expect(wrapper.emitted('input')).toEqual([[[savedLuna, privateModel]]]);
	});

	test('only offers to add text shaped like a model id, also on enter', async () => {
		const wrapper = mountPicker();
		await openMenu(wrapper);

		await searchInput(wrapper).vm.$emit('update:modelValue', 'claude');
		expect(wrapper.text()).not.toContain('Add "claude"');

		await searchInput(wrapper).vm.$emit('update:modelValue', 'openai/gpt-6-luna');
		expect(wrapper.text()).not.toContain('Add "openai/gpt-6-luna"');

		await searchInput(wrapper).vm.$emit('update:modelValue', 'acme/private-model');
		await searchInput(wrapper).vm.$emit('keydown:enter');

		expect(wrapper.emitted('input')).toEqual([[[privateModel]]]);
	});

	test('shows a notice when OpenRouter is unreachable and retries when reopened', async () => {
		vi.mocked(fetchOpenRouterModels).mockResolvedValueOnce([]);

		const wrapper = mountPicker();
		await openMenu(wrapper);

		expect(wrapper.text()).toContain("Couldn't reach OpenRouter");

		await wrapper.findComponent(VInput).vm.$emit('click');
		await openMenu(wrapper);

		expect(fetchOpenRouterModels).toHaveBeenCalledTimes(2);
		expect(wrapper.text()).not.toContain("Couldn't reach OpenRouter");
	});

	test('opens read-only when non-editable', async () => {
		const wrapper = mount(SystemOpenRouterModels, {
			props: { value: [savedLuna, savedHaiku, privateModel], disabled: true, nonEditable: true },
			global,
		});

		expect(wrapper.findComponent(VMenuStub).props('disabled')).toBe(false);

		await openMenu(wrapper);

		expect(fetchOpenRouterModels).not.toHaveBeenCalled();
		expect(wrapper.findAllComponents(VInput)).toHaveLength(1);
		expect(listedItems(wrapper).map((item) => item.text)).toEqual(['GPT-6 Luna', 'Claude Haiku 4.5', 'Private Model']);

		expect(wrapper.findAllComponents(SelectListItem).every((item) => item.props('nonEditable'))).toBe(true);
	});

	test('previews the selection like other dropdowns', async () => {
		const activatorText = (wrapper: ReturnType<typeof mountPicker>) =>
			(wrapper.findComponent(VInput).find('input').element as HTMLInputElement).value;

		const empty = mountPicker();
		const short = mountPicker([savedLuna, privateModel]);
		const long = mountPicker([savedLuna, savedHaiku, privateModel]);
		await flushPromises();

		expect(activatorText(empty)).toBe('No Items');
		expect(activatorText(short)).toBe('GPT-6 Luna, Private Model');
		expect(activatorText(long)).toBe('3 Items');
	});

	test('lists selected models above the results and removes them when unchecked', async () => {
		const wrapper = mountPicker([privateModel, savedLuna]);
		await openMenu(wrapper);

		expect(listedItems(wrapper)).toEqual([
			{ text: 'Private Model', value: 'acme/private-model' },
			{ text: 'GPT-6 Luna', value: 'openai/gpt-6-luna' },
			{ text: 'Anthropic: Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5' },
		]);

		await wrapper.findAllComponents(SelectListItem)[0]!.vm.$emit('update:modelValue', ['openai/gpt-6-luna']);

		expect(wrapper.emitted('input')).toEqual([[[savedLuna]]]);
	});
});
