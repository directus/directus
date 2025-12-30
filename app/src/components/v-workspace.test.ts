import VWorkspace from './v-workspace.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';

const global: GlobalMountOptions = {
	stubs: ['v-workspace-tile'],
};

const tiles = [
	{
		id: '1',
		x: 1,
		y: 1,
		width: 10,
		height: 10,
		name: 'My Tile 1',
	},
	{
		id: '2',
		x: 15,
		y: 5,
		width: 10,
		height: 10,
		name: 'My Tile 2',
	},
];

test('Mount component', () => {
	expect(VWorkspace).toBeTruthy();

	const wrapper = mount(VWorkspace, {
		props: {
			tiles,
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('editMode prop', async () => {
	const wrapper = mount(VWorkspace, {
		props: {
			tiles,
			editMode: true,
		},
		global,
	});

	expect(wrapper.classes()).toContain('editing');
	expect(wrapper.getComponent({ name: 'v-workspace-tile' }).props('editMode')).toBe(true);
});

test('zoomToFit prop', async () => {
	const wrapper = mount(VWorkspace, {
		props: {
			tiles,
			zoomToFit: true,
		},
		global,
	});

	expect(wrapper.get('.workspace').attributes().style).toContain('transform: scale(-0.40714285714285714)');
});
