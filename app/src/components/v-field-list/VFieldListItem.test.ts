import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { defineComponent } from 'vue';
import VFieldListItem from './VFieldListItem.vue';

const VListGroupStub = defineComponent({
	name: 'VListGroup',
	template: '<div class="v-list-group-stub"><slot name="activator" /><slot /></div>',
});

const VListItemStub = defineComponent({
	name: 'VListItem',
	emits: ['click'],
	template: '<button class="v-list-item-stub" @click="$emit(\'click\')"><slot /></button>',
});

const VIconStub = defineComponent({
	name: 'VIcon',
	props: {
		name: { type: String, required: true },
	},
	template: '<span class="v-icon-stub" :data-name="name" />',
});

const SlotStub = defineComponent({
	template: '<div><slot /></div>',
});

function mountJsonField() {
	return mount(VFieldListItem, {
		props: {
			field: {
				field: 'metadata',
				key: 'metadata',
				path: 'metadata',
				type: 'json',
				name: 'Metadata',
				collection: 'articles',
				group: false,
			},
			includeFunctions: true,
		},
		global: {
			mocks: {
				$t: (key: string) => key,
			},
			stubs: {
				VDivider: true,
				VIcon: VIconStub,
				VListGroup: VListGroupStub,
				VListItem: VListItemStub,
				VListItemContent: SlotStub,
				VListItemIcon: SlotStub,
				VTextOverflow: true,
			},
		},
	});
}

describe('VFieldListItem functions', () => {
	test('offers count and JSON functions for a JSON field', async () => {
		const wrapper = mountJsonField();
		const functionItems = wrapper.findAll('.functions .v-list-item-stub');

		expect(functionItems).toHaveLength(2);
		await functionItems[1]!.trigger('click');
		expect(wrapper.emitted('add')).toContainEqual([['json(metadata)']]);
	});

	test('uses the function icon for function entries', () => {
		const wrapper = mountJsonField();
		const icons = wrapper.findAll('.functions .v-icon-stub');

		expect(icons).toHaveLength(2);
		expect(icons.every((icon) => icon.attributes('data-name') === 'function')).toBe(true);
	});
});
