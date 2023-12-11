import { test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import VCheckboxTree from './v-checkbox-tree.vue';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';
import VListItem from '../v-list-item.vue';
import VListItemIcon from '../v-list-item-icon.vue';
import VList from '../v-list.vue';
import VListGroup from '../v-list-group.vue';
import VCheckbox from '../v-checkbox.vue';
import { h } from 'vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { Router } from 'vue-router';
import { generateRouter } from '@/__utils__/router';

let router: Router;
let global: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter([
		{
			path: '/',
			component: h('div', 'test'),
		},
		{
			path: '/test',
			component: h('div', 'empty'),
		},
	]);

	router.push('/');
	await router.isReady();

	global = {
		components: {
			VCheckboxTreeCheckbox,
			VListItem,
			VListItemIcon,
			VListGroup,
			VCheckbox,
			VList,
		},
		stubs: ['v-highlight', 'v-icon'],
		plugins: [router],
	};
});

test('Mount component', () => {
	expect(VCheckboxTree).toBeTruthy();

	const wrapper = mount(VCheckboxTree, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

// test('Choices prop', async () => {
// 	const wrapper = mount(VCheckboxTree, {
// 		props: {
// 			modelValue: ['p1', 'c1'],
// 			showSelectionOnly: true,
// 			choices: [
// 				{
// 					text: 'Parent 1',
// 					value: 'p1',
// 				},
// 				{
// 					text: 'Parent 2',
// 					value: 'p2',
// 					children: [
// 						{
// 							text: 'Child 1',
// 							value: 'c1',
// 						},
// 					],
// 				},
// 			],
// 		},
// 		global,
// 	});

// 	expect(wrapper.getComponent('.v-checkbox:nth-child(1)').classes()).toContain('checked');
// 	expect(wrapper.getComponent('.v-checkbox:nth-child(1)').props().label).toBe('Parent 1');
// 	expect(wrapper.getComponent('.v-checkbox:nth-child(2)').classes()).not.toContain('checked');

// 	await wrapper.get('.v-checkbox:nth-child(2)').trigger('click');

// 	const child1 = wrapper.get('.v-checkbox:nth-child(2)').find('.v-checkbox');
// 	expect(child1.exists()).toBeTruthy();
// 	expect(child1.props().label).toBe('Child 1');
// });
