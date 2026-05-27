import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import PrivateViewHeaderBarActionButton from './private-view-header-bar-action-button.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: { template: '<div />' },
		},
		{
			path: '/some-route',
			name: 'some-route',
			component: { template: '<div />' },
		},
		{
			path: '/test-route',
			name: 'test-route',
			component: { template: '<div />' },
		},
		{
			path: '/:pathMatch(.*)*',
			component: { template: '<div />' },
		},
	],
});

const mountOptions = {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
			}),
			router,
		],
	},
};

describe('PrivateViewHeaderBarActionButton', () => {
	test('renders the component', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		expect(wrapper.exists()).toBe(true);
	});

	test('renders with icon prop', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'delete',
			},
		});

		const icon = wrapper.findComponent({ name: 'v-icon' });
		expect(icon.exists()).toBe(true);
		expect(icon.props('name')).toBe('delete');
	});

	test('passes icon prop to VIcon with small size', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'save',
			},
		});

		const icon = wrapper.findComponent({ name: 'v-icon' });
		expect(icon.props('small')).toBe(true);
	});

	test('passes disabled prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				disabled: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('disabled')).toBe(true);
	});

	test('passes loading prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				loading: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('loading')).toBe(true);
	});

	test('passes secondary prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				secondary: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('secondary')).toBe(true);
	});

	test('passes outlined prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				outlined: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('outlined')).toBe(true);
	});

	test('passes active prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				active: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('active')).toBe(true);
	});

	test('passes to prop (router link) to VButton', () => {
		const to = { name: 'some-route' };

		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				to,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('to')).toEqual(to);
	});

	test('passes href prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				href: 'https://example.com',
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('href')).toBe('https://example.com');
	});

	test('passes download prop to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
				download: 'file.pdf',
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('download')).toBe('file.pdf');
	});

	test('passes icon prop (as string) to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('icon')).toBe(true);
	});

	test('passes rounded and small props to VButton', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('rounded')).toBe(true);
		expect(button.props('small')).toBe(true);
	});

	test('emits click event when VButton is clicked', async () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		await button.vm.$emit('click');

		expect(wrapper.emitted('click')).toBeTruthy();
		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	test('renders append-outer slot', () => {
		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
			slots: {
				'append-outer': '<span class="test-slot">Slot Content</span>',
			},
		});

		expect(wrapper.html()).toContain('Slot Content');
	});

	test('handles multiple props simultaneously', () => {
		const to = { name: 'test-route' };

		const wrapper = mount(PrivateViewHeaderBarActionButton, {
			...mountOptions,
			props: {
				icon: 'download',
				disabled: false,
				loading: false,
				secondary: true,
				outlined: true,
				to,
				active: true,
			},
		});

		const button = wrapper.findComponent({ name: 'v-button' });
		expect(button.props('icon')).toBe(true);
		expect(button.props('disabled')).toBe(false);
		expect(button.props('loading')).toBe(false);
		expect(button.props('secondary')).toBe(true);
		expect(button.props('outlined')).toBe(true);
		expect(button.props('to')).toEqual(to);
		expect(button.props('active')).toBe(true);
	});
});
