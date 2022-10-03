import { it, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import formFieldRawEditor from './form-field-raw-editor.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const i18n = createI18n();

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
			showModal: false,
			field: 'string',
			disabled: false,
			currentValue: 'things',
		},
		global,
	});
	await wrapper.find('v-button').trigger('click');
	await wrapper.vm.$nextTick();
	expect(wrapper.emitted().submit.length).toBe(1);
});

it('should cancel', async () => {
	const wrapper = mount(formFieldRawEditor, {
		props: {
			showModal: true,
			field: 'object',
			disabled: false,
			currentValue: '["id","new_content"]',
		},
		global,
	});
	await wrapper.trigger('keydown.esc');
	await wrapper.vm.$nextTick();
	expect(wrapper.emitted().cancel).toBeTruthy;
});
