import VWorkspaceTile from './v-workspace-tile.vue';
import { Tooltip } from '../__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

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
