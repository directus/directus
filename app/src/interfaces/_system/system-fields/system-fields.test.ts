import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import InterfaceSystemFields from './system-fields.vue';

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getField: vi.fn((_collectionName: string, fieldKey: string) => ({
			field: fieldKey,
			name: fieldKey,
			collection: 'directus_files',
			type: 'string',
		})),
	}),
}));

const VFieldListStub = defineComponent({
	name: 'VFieldList',
	props: {
		fieldFilter: {
			type: Function,
			required: false,
			default: undefined,
		},
	},
	template: '<div class="v-field-list-stub" />',
});

const VMenuStub = defineComponent({
	name: 'VMenu',
	template: '<div><slot name="activator" :toggle="() => undefined" :active="false" /><slot /></div>',
});

function mountComponent(props: Record<string, unknown> = {}) {
	return shallowMount(InterfaceSystemFields, {
		props: {
			collectionName: 'directus_files',
			...props,
		},
		global: {
			mocks: {
				$t: (value: string) => value,
			},
			stubs: {
				Draggable: true,
				VFieldList: VFieldListStub,
				VIcon: true,
				VList: true,
				VListItem: true,
				VMenu: VMenuStub,
				VNotice: true,
			},
		},
	});
}

describe('system-fields', () => {
	test('forwards fieldFilter to VFieldList', () => {
		const fieldFilter = vi.fn((field: { field: string }) => field.field.startsWith('$') === false);
		const wrapper = mountComponent({ fieldFilter });

		const fieldList = wrapper.findComponent(VFieldListStub);
		const passedFilter = fieldList.props('fieldFilter') as ((field: { field: string }) => boolean) | undefined;

		expect(fieldList.exists()).toBe(true);
		expect(passedFilter).toBe(fieldFilter);
		expect(passedFilter?.({ field: '$thumbnail' })).toBe(false);
		expect(passedFilter?.({ field: 'id' })).toBe(true);
	});

	test('keeps fieldFilter optional for existing callers', () => {
		const wrapper = mountComponent();

		const fieldList = wrapper.findComponent(VFieldListStub);

		expect(fieldList.props('fieldFilter')).toBeUndefined();
	});
});
