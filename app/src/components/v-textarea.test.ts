import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VTextarea from './v-textarea.vue';
import { Focus } from '@/__utils__/focus';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	directives: {
		focus: Focus,
	},
};

test('Mount component', () => {
	expect(VTextarea).toBeTruthy();

	const wrapper = mount(VTextarea, {
		props: {
			modelValue: `This is the first paragraph.
This is the second one.`,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('stlye props', async () => {
	const types = ['expand-on-focus', 'full-width', 'disabled'];

	for (const type of types) {
		const wrapper = mount(VTextarea, {
			props: {
				[type]: true,
			},
			global,
		});

		expect(wrapper.classes()).toContain(type);
	}
});

test('trim prop', async () => {
	const wrapper = mount(VTextarea, {
		props: {
			modelValue: '  This is an info  ',
			trim: true,
		},
		global,
	});

	await wrapper.get('textarea').trigger('blur');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['This is an info']);
});

test('nullable prop', async () => {
	const wrapper = mount(VTextarea, {
		props: {
			modelValue: '  This is an info  ',
			nullable: true,
		},
		global,
	});

	await wrapper.get('textarea').setValue('');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual([null]);
});
