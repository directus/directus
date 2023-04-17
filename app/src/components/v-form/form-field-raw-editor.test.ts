import { it, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import formFieldRawEditor from './form-field-raw-editor.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const i18n = createI18n({ legacy: false });

const global: GlobalMountOptions = {
	plugins: [i18n],
};

test('should render', () => {
	expect(formFieldRawEditor).toBeTruthy();

	const wrapper = mount(formFieldRawEditor, {
		props: {
			showModal: true,
			field: 'object',
			disabled: false,
			currentValue: '["id","new_content"]',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

// test if there is a value
test('submitting', async () => {
	expect(formFieldRawEditor).toBeTruthy();

	const wrapper = mount(formFieldRawEditor, {
		props: {
			showModal: true,
			field: 'string',
			disabled: false,
			currentValue: 'things',
		},
		global,
	});

	const button = wrapper.findAll('v-button').at(1);
	await button!.trigger('click');
	await wrapper.vm.$nextTick();
	expect(wrapper.emitted().setRawValue.length).toBe(1);
});

it('should cancel with keydown', async () => {
	const wrapper = mount(formFieldRawEditor, {
		props: {
			showModal: true,
			field: 'object',
			disabled: false,
			currentValue: '["id","new_content"]',
		},
		global,
	});

	await wrapper.trigger('esc');
	await wrapper.vm.$nextTick();
	expect(wrapper.emitted().cancel.length).toBe(1);
});

it('should cancel with the cancel button', async () => {
	const wrapper = mount(formFieldRawEditor, {
		props: {
			showModal: true,
			field: 'object',
			disabled: false,
			currentValue: '["id","new_content"]',
		},
		global,
	});

	const button = wrapper.findAll('v-button').at(0);
	await button!.trigger('click');
	await wrapper.vm.$nextTick();
	expect(wrapper.emitted().cancel.length).toBe(1);
});
