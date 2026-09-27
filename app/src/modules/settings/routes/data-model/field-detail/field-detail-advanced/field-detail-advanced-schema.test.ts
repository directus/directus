import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import { i18n } from '@/lang';
import { useFieldDetailStore } from '../store';

describe('field detail advanced schema', () => {
	test('enables and disables index when unique is enabled', async () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const store = useFieldDetailStore();

		store.field = {
			field: 'email',
			type: 'string',
			schema: {
				is_unique: false,
				is_indexed: false,
				is_nullable: true,
				is_primary_key: false,
				is_generated: false,
			},
			meta: {},
		};

		store.localType = 'standard';
		store.editing = '+';

		const wrapper = mount(FieldDetailAdvancedSchema, {
			global: {
				plugins: [i18n, pinia],
				stubs: {
					VIcon: true,
					VInput: true,
					VSelect: true,
					VTextarea: true,
					InterfaceInputCode: true,
				},
			},
		});

		const checkboxes = wrapper.findAllComponents(VCheckbox);
		const uniqueCheckbox = checkboxes[1]!;
		const indexCheckbox = checkboxes[2]!;

		expect(uniqueCheckbox.props('modelValue')).toBe(false);
		expect(indexCheckbox.props('modelValue')).toBe(false);
		expect(indexCheckbox.props('disabled')).toBe(false);

		store.field.schema!.is_unique = true;

		await wrapper.vm.$nextTick();

		expect(indexCheckbox.props('modelValue')).toBe(true);
		expect(indexCheckbox.props('disabled')).toBe(true);
	});
});
