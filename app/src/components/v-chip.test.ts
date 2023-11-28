import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VChip from './v-chip.vue';

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

test('active prop', async () => {
	const wrapper = mount(VChip, {
		props: {
			active: true,
			close: true,
		},
		global,
	});

	expect(wrapper.find('.v-chip').exists()).toBeTruthy();

	await wrapper.get('.close-outline').trigger('click');

	expect(wrapper.emitted()['update:active'][0]).toEqual([false]);
});

test('close prop', async () => {
	const wrapper = mount(VChip, {
		props: {
			close: true,
		},
		global,
	});

	expect(wrapper.find('.v-chip').exists()).toBeTruthy();

	await wrapper.get('.close-outline').trigger('click');

	expect(wrapper.find('.v-chip').exists()).toBeFalsy();
});

test('style props', async () => {
	const props = ['outlined', 'label', 'disabled', 'close', 'x-small', 'small', 'large', 'x-large'];

	for (const prop of props) {
		const wrapper = mount(VChip, {
			props: {
				[prop]: true,
			},
			global,
		});

		expect(wrapper.classes()).toContain(prop);
	}
});
