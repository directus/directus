import { directive } from '@/directives/click-outside';
import { mount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import TransitionBounce from './transition/bounce.vue';
import VMenu from './v-menu.vue';

vi.mock('lodash', async () => {
	const mod = await vi.importActual<{ default: typeof import('lodash') }>('lodash');
	return {
		...mod.default,
		debounce: (fn: any) => fn,
	};
});

beforeEach(() => {
	// create teleport target
	const el = document.createElement('div');
	el.id = 'menu-outlet';
	document.body.appendChild(el);
});

const Content = {
	template: '<div>Content</div>',
};

const mountOptions = {
	global: {
		directives: {
			'click-outside': directive as any,
		},
		components: {
			TransitionBounce,
		},
	},
	slots: {
		default: Content,
	},
};

test('Mount component', () => {
	expect(VMenu).toBeTruthy();

	const wrapper = mount(VMenu, mountOptions);

	expect(wrapper.html()).toMatchSnapshot();
});

test('should not have click event listener when trigger is not "click"', async () => {
	const wrapper = mount(VMenu, mountOptions);

	await wrapper.find('.v-menu').trigger('click');

	expect(wrapper.findComponent(Content).exists()).toBe(false);
});

test('should have click event listener when trigger is "click"', async () => {
	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	expect(wrapper.findComponent(Content).exists()).toBe(true);
});

test('should not have click event listener when closeOnContentClick prop is false', async () => {
	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			modelValue: true, // make it open in the beginning to ensure content is in the dom
			closeOnContentClick: false,
		},
	});

	await wrapper.setProps({ 'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }) });

	await wrapper.findComponent(Content).trigger('click');

	expect(wrapper.props('modelValue')).toBe(true);
});

test('should have click event listener when closeOnContentClick prop is true', async () => {
	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			modelValue: true, // make it open in the beginning to ensure content is in the dom
			closeOnContentClick: true,
		},
	});

	await wrapper.setProps({ 'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }) });

	await wrapper.findComponent(Content).trigger('click');

	expect(wrapper.props('modelValue')).toBe(false);
});

test('should not have pointerenter and pointerleave event listener when trigger is not "hover"', async () => {
	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			modelValue: true, // make it open in the beginning to ensure '.v-menu-content' is in the dom
		},
	});

	await wrapper.setProps({ 'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }) });

	await wrapper.findComponent(TransitionBounce).find('.v-menu-content').trigger('pointerenter');
	await wrapper.findComponent(TransitionBounce).find('.v-menu-content').trigger('pointerleave');

	expect(wrapper.props('modelValue')).toBe(true);
});

test('should have pointerenter and pointerleave event listener when trigger is "hover"', async () => {
	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			modelValue: true, // make it open in the beginning to ensure '.v-menu-content' is in the dom
			trigger: 'hover',
		},
	});

	await wrapper.setProps({ 'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }) });

	await wrapper.findComponent(TransitionBounce).find('.v-menu-content').trigger('pointerenter');
	await wrapper.findComponent(TransitionBounce).find('.v-menu-content').trigger('pointerleave');

	expect(wrapper.props('modelValue')).toBe(false);
});
