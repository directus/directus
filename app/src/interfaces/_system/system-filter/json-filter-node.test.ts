import type { FieldFilter } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { defineComponent } from 'vue';
import JsonFilterNode from './json-filter-node.vue';
import { JSON_VALUE_KEY } from './utils';
import { i18n } from '@/lang';

const VSelectStub = defineComponent({
	name: 'VSelect',
	props: {
		items: { type: Array, required: true },
		modelValue: { type: String, required: true },
	},
	emits: ['update:model-value'],
	template: '<button class="v-select-stub" />',
});

const InputGroupStub = defineComponent({
	name: 'InputGroup',
	props: {
		field: { type: Object, required: true },
	},
	emits: ['update:field'],
	template: '<div class="input-group-stub" />',
});

const defaultNode = {
	metadata: {
		_json: {
			'data.tags[0]': { _eq: 'featured' },
		},
	},
};

function mountComponent(node: FieldFilter = defaultNode) {
	return mount(JsonFilterNode, {
		props: {
			node,
			fieldLabel: 'Metadata',
			collection: 'articles',
		},
		global: {
			plugins: [i18n],
			directives: {
				'input-auto-width': () => undefined,
			},
			stubs: {
				InputGroup: InputGroupStub,
				VSelect: VSelectStub,
			},
		},
	});
}

describe('JsonFilterNode', () => {
	test('preserves a literal JSON path when editing it', async () => {
		const wrapper = mountComponent();
		const pathInput = wrapper.find<HTMLInputElement>('input.json-path-input');

		expect(pathInput.element.value).toBe('data.tags[0]');
		await pathInput.setValue('author.name');

		expect(wrapper.emitted('update:node')?.at(-1)).toEqual([
			{ metadata: { _json: { 'author.name': { _eq: 'featured' } } } },
		]);
	});

	test('reshapes the value when the comparator changes', async () => {
		const wrapper = mountComponent();

		await wrapper.findComponent(VSelectStub).vm.$emit('update:model-value', '_between');

		expect(wrapper.emitted('update:node')?.at(-1)).toEqual([
			{ metadata: { _json: { 'data.tags[0]': { _between: ['featured'] } } } },
		]);
	});

	test('coerces range entries before rebuilding the filter', async () => {
		const wrapper = mountComponent({ metadata: { _json: { rating: { _between: ['', ''] } } } });

		await wrapper.findComponent(InputGroupStub).vm.$emit('update:field', {
			[JSON_VALUE_KEY]: { _between: ['3', '5'] },
		});

		expect(wrapper.emitted('update:node')?.at(-1)).toEqual([{ metadata: { _json: { rating: { _between: [3, 5] } } } }]);
	});
});
