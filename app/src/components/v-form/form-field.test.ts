import VMenu from '../v-menu.vue';
import FormField from '@/components/v-form/form-field.vue';
import { i18n } from '@/lang';
import { Width } from '@directus/system-data';
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

const baseField = {
	field: 'test',
	name: 'Test Field',
	collection: 'test_collection',
	meta: {
		width: 'full' as Width,
		readonly: false,
		hideLabel: false,
		special: [],
		note: '',
		validation_message: '',
		validation: undefined,
	},
	schema: {
		default_value: undefined,
	},
};

const global = {
	components: { VMenu },
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
};

describe('FormField', () => {
	it('should show FormFieldLabel in batch mode if field.meta.special does not include "no-data"', () => {
		const wrapper = mount(FormField, {
			props: {
				field: { ...baseField, hideLabel: true, meta: { ...baseField.meta, special: [] } },
				batchMode: true,
				batchActive: true,
			},
			global,
		});

		// Label should be visible
		expect(wrapper.findComponent({ name: 'FormFieldLabel' }).exists()).toBe(true);
	});

	it('should hide FormFieldLabel in batch mode if field.meta.special includes "no-data"', () => {
		const wrapper = mount(FormField, {
			props: {
				field: { ...baseField, hideLabel: true, meta: { ...baseField.meta, special: ['no-data'] } },
				batchMode: true,
				batchActive: true,
			},
			global,
		});

		// Label should be hidden
		expect(wrapper.findComponent({ name: 'FormFieldLabel' }).exists()).toBe(false);
	});

	it('should hide FormFieldLabel if field.hideLabel is true and not in batch mode', () => {
		const wrapper = mount(FormField, {
			props: {
				field: { ...baseField, hideLabel: true },
				batchMode: false,
			},
			global,
		});

		expect(wrapper.findComponent({ name: 'FormFieldLabel' }).exists()).toBe(false);
	});
});
