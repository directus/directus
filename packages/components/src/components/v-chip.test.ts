import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VChip from './v-chip.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
};

test('Mount component', () => {
	expect(VChip).toBeTruthy();

	const wrapper = mount(VChip, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VChip, {
		props: {
			modelValue: 'my value',
		},
		global,
	});

	expect(wrapper.get('input').element.value).toBe('my value');

	await wrapper.find('input').setValue('my value1');

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['my value1']);
});
