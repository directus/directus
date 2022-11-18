import { mount } from '@vue/test-utils';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { beforeEach, expect, test, vi } from 'vitest';

import { directive } from '@/directives/click-outside';
import TransitionBounce from './transition/bounce.vue';
import VMenu from './v-menu.vue';

beforeEach(() => {
	// create teleport target
	const el = document.createElement('div');
	el.id = 'menu-outlet';
	document.body.appendChild(el);

	// mocking this as it seems like there's observer undefined error in happy-dom
	// but it is not crucial for the current test cases at the moment
	vi.spyOn(MutationObserver.prototype, 'disconnect').mockResolvedValue();
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

test('should not have pointerenter and pointerleave event listener when trigger is not "hover"', () => {
	const wrapper = mount(VMenu, {
		props: {
			modelValue: true, // make it open in the beginning to ensure '.v-menu-content' is in the dom
		},
		global,
	});

	const activatorListeners = (wrapper.find({ ref: 'activator' }).element as any)._listeners;
	expect(activatorListeners).not.toHaveProperty('pointerenter');
	expect(activatorListeners).not.toHaveProperty('pointerleave');

	// we need to use getComponent because it's teleported
	const vMenuContentListeners = (wrapper.getComponent(TransitionBounce).find('.v-menu-content').element as any)
		._listeners;
	expect(vMenuContentListeners).not.toHaveProperty('pointerenter');
	expect(vMenuContentListeners).not.toHaveProperty('pointerleave');
});

test('should have pointerenter and pointerleave event listener when trigger is "hover"', () => {
	const wrapper = mount(VMenu, {
		props: {
			modelValue: true, // make it open in the beginning to ensure '.v-menu-content' is in the dom
			trigger: 'hover',
		},
		global,
	});

	const activatorListeners = (wrapper.find({ ref: 'activator' }).element as any)._listeners;
	expect(activatorListeners).toHaveProperty('pointerenter');
	expect(activatorListeners).toHaveProperty('pointerleave');

	// we need to use getComponent because it's teleported
	const vMenuContentListeners = (wrapper.getComponent(TransitionBounce).find('.v-menu-content').element as any)
		._listeners;
	expect(vMenuContentListeners).toHaveProperty('pointerenter');
	expect(vMenuContentListeners).toHaveProperty('pointerleave');
});
