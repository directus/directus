import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import InputM2o from './input-m2o.vue';
import api from '@/api';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: (fields: string[]) => fields,
}));

const VMenuStub = defineComponent({
	name: 'VMenu',
	props: { modelValue: { type: Boolean, default: false } },
	emits: ['update:modelValue'],
	template: `<div>
		<slot name="activator" v-bind="{ toggle: () => $emit('update:modelValue', !modelValue) }" />
		<div v-if="modelValue" class="menu"><slot /></div>
	</div>`,
});

const VInputStub = defineComponent({
	name: 'VInput',
	props: { modelValue: { type: String, default: null } },
	emits: ['update:modelValue', 'keydown:enter'],
	template: `<input class="search" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" @keydown.enter="$emit('keydown:enter', $event)" />`,
});

const VListItemStub = defineComponent({
	name: 'VListItem',
	emits: ['click'],
	template: '<div class="list-item" @click="$emit(\'click\')"><slot /></div>',
});

const RenderTemplateStub = defineComponent({
	name: 'RenderTemplate',
	props: { item: { type: Object, required: true } },
	template: '<span class="label">{{ item.name }}</span>',
});

const FIELDS: Record<string, any> = {
	id: { collection: 'tags', field: 'id', type: 'integer', schema: { is_primary_key: true } },
	name: { collection: 'tags', field: 'name', type: 'string', schema: { is_primary_key: false } },
};

function mountInput(value: string | number | null = null) {
	const pinia = createTestingPinia({ createSpy: vi.fn });

	const fieldsStore = useFieldsStore();
	vi.mocked(fieldsStore.getPrimaryKeyFieldForCollection).mockReturnValue(FIELDS.id);
	vi.mocked(fieldsStore.getField).mockImplementation((_collection, field) => FIELDS[field] ?? null);

	const collectionsStore = useCollectionsStore();
	vi.mocked(collectionsStore.getCollection).mockReturnValue({ meta: { display_template: '{{ name }}' } } as any);

	return mount(InputM2o, {
		props: { value, relatedCollection: 'tags' },
		global: {
			plugins: [pinia, i18n],
			stubs: {
				VMenu: VMenuStub,
				VInput: VInputStub,
				VList: { template: '<div><slot /></div>' },
				VListItem: VListItemStub,
				VListItemContent: { template: '<div><slot /></div>' },
				VListItemIcon: { template: '<div><slot /></div>' },
				VIcon: true,
				VProgressCircular: true,
				RenderTemplate: RenderTemplateStub,
			},
		},
	});
}

function respondWith(items: Record<string, unknown>[]) {
	vi.mocked(api.get).mockResolvedValue({ data: { data: items } });
}

function lastParams(): Record<string, any> {
	return vi.mocked(api.get).mock.lastCall?.[1]?.params as Record<string, any>;
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.mocked(api.get).mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('input-m2o', () => {
	test('lists the first related items when opened', async () => {
		respondWith([
			{ id: 1, name: 'Alpha' },
			{ id: 2, name: 'Beta' },
		]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await flushPromises();

		expect(api.get).toHaveBeenCalledWith('/items/tags', { params: { fields: ['name', 'id'], limit: 10 } });
		expect(wrapper.findAll('.menu .label').map((label) => label.text())).toEqual(['Alpha', 'Beta']);
	});

	test('searches the text fields of the display template, and the primary key when the input is a valid key', async () => {
		respondWith([]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await flushPromises();

		await wrapper.find('.search').setValue('alp');
		await vi.advanceTimersByTimeAsync(300);

		expect(lastParams().filter).toEqual({ _or: [{ name: { _icontains: 'alp' } }] });

		await wrapper.find('.search').setValue('12');
		await vi.advanceTimersByTimeAsync(300);

		expect(lastParams().filter).toEqual({ _or: [{ name: { _icontains: '12' } }, { id: { _eq: '12' } }] });
	});

	test('lists the first items again when the search is cleared', async () => {
		respondWith([]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await wrapper.find('.search').setValue('alp');
		await vi.advanceTimersByTimeAsync(300);

		wrapper.findComponent(VInputStub).vm.$emit('update:modelValue', null);
		await vi.advanceTimersByTimeAsync(300);

		expect(lastParams()).toEqual({ fields: ['name', 'id'], limit: 10 });
	});

	test('picks an item on click', async () => {
		respondWith([
			{ id: 1, name: 'Alpha' },
			{ id: 2, name: 'Beta' },
		]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await flushPromises();

		await wrapper.findAll('.list-item')[1]!.trigger('click');

		expect(wrapper.emitted('input')).toEqual([[2]]);
	});

	test('Enter picks the item whose primary key matches the input over the first result', async () => {
		respondWith([
			{ id: 3, name: 'Room 12' },
			{ id: 12, name: 'Gamma' },
		]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await wrapper.find('.search').setValue('12');
		await wrapper.find('.search').trigger('keydown.enter');
		await flushPromises();

		expect(wrapper.emitted('input')).toEqual([[12]]);
	});

	test('Enter uses the input as the value when nothing matches', async () => {
		respondWith([]);

		const wrapper = mountInput();
		await wrapper.find('.preview').trigger('click');
		await wrapper.find('.search').setValue('$CURRENT_USER');
		await wrapper.find('.search').trigger('keydown.enter');
		await flushPromises();

		expect(wrapper.emitted('input')).toEqual([['$CURRENT_USER']]);
	});

	test('shows the label of a value that is already set', async () => {
		respondWith([{ id: 5, name: 'Epsilon' }]);

		const wrapper = mountInput(5);
		await flushPromises();

		expect(lastParams()).toEqual({ fields: ['name', 'id'], filter: { id: { _eq: 5 } }, limit: 1 });
		expect(wrapper.find('.preview .label').text()).toBe('Epsilon');
	});

	test('shows a dynamic variable as is, without looking it up', async () => {
		const wrapper = mountInput('$CURRENT_USER');
		await flushPromises();

		expect(api.get).not.toHaveBeenCalled();
		expect(wrapper.find('.preview').text()).toBe('$CURRENT_USER');
	});
});
