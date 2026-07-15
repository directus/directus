import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import Nodes from './Nodes.vue';
import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';

const DraggableStub = defineComponent({
	// eslint-disable-next-line vue/multi-word-component-names
	name: 'Draggable',
	props: {
		list: { type: Array, required: true },
	},
	template: `
		<ul>
			<li v-for="(element, index) in list" :key="index">
				<slot name="item" v-bind="{ element, index }" />
			</li>
		</ul>
	`,
});

const VMenuStub = defineComponent({
	name: 'VMenu',
	template: '<div><slot name="activator" v-bind="{ toggle: () => {} }" /><slot /></div>',
});

const VSelectStub = defineComponent({
	name: 'VSelect',
	props: {
		items: { type: Array, required: true },
		modelValue: { type: String, default: undefined },
	},
	emits: ['update:model-value'],
	template: '<button class="v-select-stub" />',
});

const VFieldListStub = defineComponent({
	name: 'VFieldList',
	emits: ['add'],
	template: '<div class="v-field-list-stub" />',
});

function mountNodes(props: Record<string, any> = {}) {
	const pinia = createTestingPinia({ createSpy: vi.fn });

	const fieldsStore = useFieldsStore();

	vi.mocked(fieldsStore.getField).mockReturnValue({
		collection: 'articles',
		field: 'metadata',
		name: 'Metadata',
		type: 'json',
	} as any);

	const wrapper = mount(Nodes, {
		props: {
			filter: [{ metadata: { _nnull: true } }],
			collection: 'articles',
			variableInputEnabled: false,
			...props,
		},
		global: {
			plugins: [i18n, pinia],
			directives: {
				tooltip: () => undefined,
			},
			stubs: {
				Draggable: DraggableStub,
				VMenu: VMenuStub,
				VSelect: VSelectStub,
				VFieldList: VFieldListStub,
				VIcon: true,
				InputGroup: true,
				JsonFilterNode: true,
			},
		},
	});

	return wrapper;
}

describe('Nodes JSON filter gating', () => {
	test('offers the json comparator for a raw JSON field by default', () => {
		const wrapper = mountNodes();
		const items = wrapper.findComponent(VSelectStub).props('items') as { value: string }[];

		expect(items.map((item) => item.value)).toContain('_json');
	});

	test('hides the json comparator when includeJsonFunction is false', () => {
		const wrapper = mountNodes({ includeJsonFunction: false });
		const items = wrapper.findComponent(VSelectStub).props('items') as { value: string }[];

		expect(items.map((item) => item.value)).not.toContain('_json');
		expect(items.length).toBeGreaterThan(0);
	});

	test('ignores a _json comparator selection when disabled', async () => {
		const wrapper = mountNodes({ includeJsonFunction: false });

		await wrapper.findComponent(VSelectStub).vm.$emit('update:model-value', '_json');
		expect(wrapper.emitted('update:filter')).toBeUndefined();

		await wrapper.findComponent(VSelectStub).vm.$emit('update:model-value', '_null');
		expect(wrapper.emitted('update:filter')).toHaveLength(1);
	});

	test('ignores selecting the json function entry when disabled', async () => {
		const wrapper = mountNodes({ includeJsonFunction: false });

		await wrapper.findComponent(VFieldListStub).vm.$emit('add', ['json(metadata)']);
		expect(wrapper.emitted('update:filter')).toBeUndefined();
	});

	test('builds a _json node from the json function entry when enabled', async () => {
		const wrapper = mountNodes();

		await wrapper.findComponent(VFieldListStub).vm.$emit('add', ['json(metadata)']);

		const emitted = wrapper.emitted('update:filter');
		expect(emitted).toHaveLength(1);
		expect(JSON.stringify(emitted![0])).toContain('_json');
	});

	test('still renders an existing _json node when disabled', () => {
		const wrapper = mountNodes({
			filter: [{ metadata: { _json: { 'data.tags[0]': { _eq: 'featured' } } } }],
			includeJsonFunction: false,
		});

		expect(wrapper.findComponent({ name: 'JsonFilterNode' }).exists()).toBe(true);
	});
});
