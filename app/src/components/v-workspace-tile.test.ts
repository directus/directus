import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { Tooltip } from '../__utils__/tooltip';
import VWorkspaceTile from './v-workspace-tile.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const i18n = createI18n({ legacy: false });

const props = {
	id: '1',
	x: 1,
	y: 1,
	width: 10,
	height: 10,
};

const global: GlobalMountOptions = {
	stubs: ['v-icon', 'v-menu', 'v-text-overflow', 'v-list', 'v-list-item', 'v-list-item-icon', 'v-list-item-content'],
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
	directives: {
		Tooltip,
	},
};

test('Mount component', () => {
	expect(VWorkspaceTile).toBeTruthy();

	const wrapper = mount(VWorkspaceTile, {
		props,
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

describe('Edit mode', () => {
	const globalWithMenu: GlobalMountOptions = {
		...global,
		stubs: {
			'v-icon': true,
			'v-text-overflow': true,
			'v-list-item': true,
			'v-list-item-icon': true,
			'v-list-item-content': true,
			'v-menu': { template: '<div><slot /></div>' },
			'v-list': { template: '<div><slot /></div>' },
		},
	};

	test('should hide resize handlers when not draggable', () => {
		const wrapper = mount(VWorkspaceTile, {
			props: { ...props, editMode: true, draggable: false },
			global,
		});

		expect(wrapper.find('.resize-handlers').exists()).toBe(false);
	});

	test('should disable actions the user is not allowed to perform', () => {
		const wrapper = mount(VWorkspaceTile, {
			props: { ...props, editMode: true, createAllowed: false, updateAllowed: false, deleteAllowed: false },
			global: globalWithMenu,
		});

		expect(wrapper.find('.edit-icon').attributes('disabled')).toBe('true');

		const items = wrapper.findAll('v-list-item-stub');

		expect(items).toHaveLength(3);
		expect(items.map((item) => item.attributes('disabled'))).toEqual(['true', 'true', 'true']);
	});

	test('should enable all actions by default', () => {
		const wrapper = mount(VWorkspaceTile, {
			props: { ...props, editMode: true },
			global: globalWithMenu,
		});

		expect(wrapper.find('.edit-icon').attributes('disabled')).toBe('false');

		expect(wrapper.findAll('v-list-item-stub').map((item) => item.attributes('disabled'))).toEqual([
			'false',
			'false',
			'false',
		]);
	});
});
