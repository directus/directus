import { Focus } from '@/__utils__/focus';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Router } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import VResizeable from './v-resizeable.vue';
import type { ResizeableOptions } from './v-resizeable.vue';

// Mock the useUserStore
vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(),
}));

// Mock vueuse composables
vi.mock('@vueuse/core', () => ({
	useElementVisibility: vi.fn(() => true),
	useEventListener: vi.fn(),
}));

let router: Router;
let global: GlobalMountOptions;
let mockUserStore: any;

const defaultProps = {
	width: 200,
	minWidth: 100,
	maxWidth: 500,
	defaultWidth: 200,
	disabled: false,
};

beforeEach(async () => {
	const pinia = createPinia();
	setActivePinia(pinia);

	// Mock user store
	mockUserStore = {
		textDirection: 'ltr',
	};

	vi.mocked(useUserStore).mockReturnValue(mockUserStore);

	router = generateRouter();
	router.push('/');
	await router.isReady();

	global = {
		stubs: [],
		directives: {
			focus: Focus,
			tooltip: Tooltip,
		},
		plugins: [router, pinia, i18n],
	};
});

describe('VResizeable', () => {
	test('Mount component', () => {
		expect(VResizeable).toBeTruthy();

		const wrapper = mount(VResizeable, {
			props: defaultProps,
			slots: {
				default: '<div class="test-content">Test Content</div>',
			},
			global,
		});

		expect(wrapper.find('.resize-wrapper').exists()).toBe(true);
		expect(wrapper.find('.test-content').exists()).toBe(true);
	});

	test('renders slot content correctly', () => {
		const wrapper = mount(VResizeable, {
			props: defaultProps,
			slots: {
				default: '<div class="slot-content">Slot Content</div>',
			},
			global,
		});

		expect(wrapper.text()).toContain('Slot Content');
		expect(wrapper.find('.slot-content').exists()).toBe(true);
	});

	test('shows grab bar when not disabled', () => {
		const wrapper = mount(VResizeable, {
			props: defaultProps,
			slots: {
				default: '<div>Content</div>',
			},
			global,
		});

		expect(wrapper.find('.grab-bar').exists()).toBe(true);
	});

	test('does not show grab bar when disabled', () => {
		const wrapper = mount(VResizeable, {
			props: {
				...defaultProps,
				disabled: true,
			},
			slots: {
				default: '<div>Content</div>',
			},
			global,
		});

		expect(wrapper.find('.grab-bar').exists()).toBe(false);
		expect(wrapper.find('.resize-wrapper').exists()).toBe(false);
	});

	test('applies always-show class when alwaysShowHandle option is true', () => {
		const options: ResizeableOptions = {
			alwaysShowHandle: true,
		};

		const wrapper = mount(VResizeable, {
			props: {
				...defaultProps,
				options,
			},
			slots: {
				default: '<div>Content</div>',
			},
			global,
		});

		const grabBar = wrapper.find('.grab-bar');
		expect(grabBar.exists()).toBe(true);
		expect(grabBar.classes()).toContain('always-show');
	});

	describe('Pointer interactions', () => {
		test('activates grab bar on pointer enter', async () => {
			const wrapper = mount(VResizeable, {
				props: defaultProps,
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const grabBar = wrapper.find('.grab-bar');

			await grabBar.trigger('pointerenter');
			expect(grabBar.classes()).toContain('active');
		});

		test('deactivates grab bar on pointer leave', async () => {
			const wrapper = mount(VResizeable, {
				props: defaultProps,
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const grabBar = wrapper.find('.grab-bar');

			await grabBar.trigger('pointerenter');
			expect(grabBar.classes()).toContain('active');

			await grabBar.trigger('pointerleave');
			expect(grabBar.classes()).not.toContain('active');
		});

		test('starts dragging on pointer down', async () => {
			const wrapper = mount(VResizeable, {
				props: defaultProps,
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const grabBar = wrapper.find('.grab-bar');

			await grabBar.trigger('pointerdown', {
				pageX: 100,
			});

			// Check that dragging event is emitted
			expect(wrapper.emitted('dragging')).toBeTruthy();
			expect(wrapper.emitted('dragging')?.[0]).toEqual([true]);
		});

		test('emits width update on double click (reset)', async () => {
			const wrapper = mount(VResizeable, {
				props: {
					...defaultProps,
					width: 300, // Different from defaultWidth
				},
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const grabBar = wrapper.find('.grab-bar');

			await grabBar.trigger('dblclick');

			expect(wrapper.emitted('update:width')).toBeTruthy();
			expect(wrapper.emitted('update:width')?.[0]).toEqual([defaultProps.defaultWidth]);
		});
	});

	describe('Transitions', () => {
		test('applies transition class when not dragging', () => {
			const wrapper = mount(VResizeable, {
				props: defaultProps,
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const resizeWrapper = wrapper.find('.resize-wrapper');
			expect(resizeWrapper.classes()).toContain('transition');
		});

		test('does not apply transition class when disableTransition is true', () => {
			const options: ResizeableOptions = {
				disableTransition: true,
			};

			const wrapper = mount(VResizeable, {
				props: {
					...defaultProps,
					options,
				},
				slots: {
					default: '<div>Content</div>',
				},
				global,
			});

			const resizeWrapper = wrapper.find('.resize-wrapper');
			expect(resizeWrapper.classes()).not.toContain('transition');
		});
	});
});
