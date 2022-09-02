import { test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import VMenu from './v-menu.vue';
import TransitionBounce from './transition/bounce.vue';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { directive } from '../../../../app/src/directives/click-outside';

beforeEach(() => {
	// create teleport target
	const el = document.createElement('div');
	el.id = 'menu-outlet';
	document.body.appendChild(el);
});

const global: GlobalMountOptions = {
	directives: {
		'click-outside': directive as any,
	},
	components: {
		TransitionBounce,
	},
};

test('Mount component', () => {
	expect(VMenu).toBeTruthy();

	const wrapper = mount(VMenu, {
		slots: {
			default: 'Slot Content',
		},
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});
