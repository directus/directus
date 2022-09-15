import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VInput from './v-input.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { Focus } from '@/__utils__/focus';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
	directives: {
		focus: Focus,
	},
};

test('Mount component', () => {
	expect(VInput).toBeTruthy();

	const wrapper = mount(VInput, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: 'my value',
		},
		global,
	});

	expect(wrapper.get('input').element.value).toBe('my value');

	await wrapper.find('input').setValue('my value1');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['my value1']);
});

test('modelValue trim', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: '  please trim that beard    ',
			trim: true,
		},
		global,
	});

	await wrapper.find('input').trigger('blur');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['please trim that beard']);
});

test('modelValue dbSafe', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: 'this $hould be Dß save!!',
			dbSafe: true,
		},
		global,
	});

	await wrapper.find('input').trigger('input');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['this_hould_be_D_save']);
});
