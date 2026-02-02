import { Width } from '@directus/system-data';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickOutside } from '@/__utils__/click-outside';
import { Md } from '@/__utils__/md';
import { Tooltip } from '@/__utils__/tooltip';
import FormField from '@/components/v-form/components/form-field.vue';
import VMenu from '@/components/v-menu.vue';
import { i18n } from '@/lang';

beforeEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		if (!document.getElementById(id)) {
			const el = document.createElement('div');
			el.id = id;
			document.body.appendChild(el);
		}
	}
});

afterEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		const el = document.getElementById(id);
		if (el) el.remove();
	}
});

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
	directives: {
		'click-outside': ClickOutside,
		md: Md,
		tooltip: Tooltip,
	},
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
