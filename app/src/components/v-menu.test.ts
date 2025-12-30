import TransitionBounce from './transition/bounce.vue';
import VMenu from './v-menu.vue';
import { directive } from '@/directives/click-outside';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';

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
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
			}),
		],
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
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
		},
		slots: {
			default: button,
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	expect(wrapper.findComponent(button).exists()).toBe(true);
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

test('should place menu at bottom-start when menu is attached and using ltr', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: true,
		},
		slots: {
			default: button,
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuContent = wrapper.findComponent(TransitionBounce).find('.v-menu-popper');

	expect(menuContent.attributes('data-placement')).toBe('bottom-start');
});

test('should place menu at "bottom-start" when menu is not attached and placement is "bottom-start" and using ltr', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'bottom-start',
		},
		slots: {
			default: button,
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuContent = wrapper.findComponent(TransitionBounce).find('.v-menu-popper');

	expect(menuContent.attributes('data-placement')).toBe('bottom-start');
});

test('should place menu at "bottom-end" when menu is attached and using rtl', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: true,
		},
		slots: {
			default: button,
		},
		global: {
			...mountOptions.global,
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuContent = wrapper.findComponent(TransitionBounce).find('.v-menu-popper');

	expect(menuContent.attributes('data-placement')).toBe('bottom-end');
});

test('should place menu at "bottom-end" when menu is not attached and placement is "bottom-start" and using rtl', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'bottom-start',
		},
		slots: {
			default: button,
		},
		global: {
			...mountOptions.global,
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuContent = wrapper.findComponent(TransitionBounce).find('.v-menu-popper');

	expect(menuContent.attributes('data-placement')).toBe('bottom-end');
});

test('should place menu arrow at left when using placement "top-start" and using ltr', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'top-start',
			showArrow: true,
			arrowPlacement: 'start',
		},
		slots: {
			default: button,
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuArrow = wrapper.findComponent(TransitionBounce).find('.arrow');

	expect(menuArrow.attributes('style')).toContain('left: 0px');
	expect(menuArrow.attributes('style')).toContain('transform: translate3d(6px, 0px, 0)');
});

test('should place menu arrow at left when using placement "bottom-start" and using ltr', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'bottom-start',
			showArrow: true,
			arrowPlacement: 'start',
		},
		slots: {
			default: button,
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuArrow = wrapper.findComponent(TransitionBounce).find('.arrow');

	expect(menuArrow.attributes('style')).toContain('left: 0px');
	expect(menuArrow.attributes('style')).toContain('transform: translate3d(6px, 0px, 0)');
});

test('should place menu arrow right when using placement "top-start" and using rtl', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'top-start',
			showArrow: true,
			arrowPlacement: 'start',
			arrowPadding: 6,
		},
		slots: {
			default: button,
		},
		global: {
			...mountOptions.global,
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuArrow = wrapper.findComponent(TransitionBounce).find('.arrow');

	expect(menuArrow.attributes('style')).toContain('left: unset');
	expect(menuArrow.attributes('style')).toContain('right: 0px');
	expect(menuArrow.attributes('style')).toContain('transform: translate3d(-6px, 0px, 0)');
});

test('should place menu arrow right when using placement "bottom-start" and using rtl', async () => {
	const button = { template: '<button type="button">Content</button>' };

	const wrapper = mount(VMenu, {
		...mountOptions,
		props: {
			trigger: 'click',
			attached: false,
			placement: 'bottom-start',
			showArrow: true,
			arrowPlacement: 'start',
		},
		slots: {
			default: button,
		},
		global: {
			...mountOptions.global,
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					stubActions: false,
					initialState: {
						userStore: {
							currentUser: { text_direction: 'rtl' },
						},
					},
				}),
			],
		},
	});

	await wrapper.find('.v-menu').trigger('click');

	const menuArrow = wrapper.findComponent(TransitionBounce).find('.arrow');

	expect(menuArrow.attributes('style')).toContain('left: unset');
	expect(menuArrow.attributes('style')).toContain('right: 0px');
	expect(menuArrow.attributes('style')).toContain('transform: translate3d(-6px, 0px, 0)');
});
