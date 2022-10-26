import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VWorkspaceTile from './v-workspace-tile.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { createI18n } from 'vue-i18n';
import { Tooltip } from '../__utils__/tooltip';

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
	plugins: [i18n],
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
