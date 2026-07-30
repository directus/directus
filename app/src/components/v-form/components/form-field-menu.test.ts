import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import FormFieldMenu from '@/components/v-form/components/form-field-menu.vue';
import { i18n } from '@/lang';

const baseField = {
	field: 'test',
	name: 'Test Field',
	collection: 'test_collection',
	meta: { interface: 'input-rich-text-html' },
	schema: { default_value: null, is_nullable: true },
};

// VListItem pulls in vue-router's useLink; stub it to a slot passthrough. VIcon needs a store.
const global = {
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
	stubs: { VListItem: { template: '<li><slot /></li>' }, VIcon: true },
};

function textOf(wrapper: ReturnType<typeof mount>) {
	return wrapper.text();
}

describe('FormFieldMenu raw-value option', () => {
	it('shows "Edit Raw Value" for an unrestricted, unlocked field', () => {
		const wrapper = mount(FormFieldMenu, {
			props: { field: baseField, restricted: false, interfaceLocked: false },
			global,
		});

		expect(textOf(wrapper)).toContain('Edit Raw Value');
		expect(textOf(wrapper)).not.toContain('View Raw Value');
	});

	it('shows "View Raw Value" instead of "Edit Raw Value" when the interface reports itself locked', () => {
		const wrapper = mount(FormFieldMenu, {
			props: { field: baseField, restricted: false, interfaceLocked: true },
			global,
		});

		expect(textOf(wrapper)).toContain('View Raw Value');
		expect(textOf(wrapper)).not.toContain('Edit Raw Value');
	});

	it('shows "Paste Raw Value" for an unrestricted, unlocked field', () => {
		const wrapper = mount(FormFieldMenu, {
			props: { field: baseField, restricted: false, interfaceLocked: false },
			global,
		});

		expect(textOf(wrapper)).toContain('Paste Raw Value');
	});

	it('hides "Paste Raw Value" when the interface reports itself locked (it also bypasses the guard)', () => {
		const wrapper = mount(FormFieldMenu, {
			props: { field: baseField, restricted: false, interfaceLocked: true },
			global,
		});

		expect(textOf(wrapper)).not.toContain('Paste Raw Value');
	});
});
