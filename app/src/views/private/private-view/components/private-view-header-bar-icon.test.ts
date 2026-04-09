import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import PrivateViewHeaderBarIcon from './private-view-header-bar-icon.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: { template: '<div />' },
		},
		{
			path: '/back',
			name: 'back',
			component: { template: '<div />' },
		},
	],
});

const pinia = createPinia();

const mountOptions = {
	global: {
		plugins: [router, pinia],
	},
};

describe('PrivateViewHeaderBarIcon', () => {
	test('renders the component', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, mountOptions);

		expect(wrapper.exists()).toBe(true);
	});

	test('renders back button when backTo is provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const backButton = wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' });
		expect(backButton.exists()).toBe(true);
		expect(backButton.classes()).toContain('back-button');
	});

	test('back button has correct props', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const actionButton = wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' });
		expect(actionButton.props('icon')).toBe('arrow_back');
		expect(actionButton.props('variant')).toBe('ghost');
	});

	test('back button renders arrow_back icon', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const actionButton = wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' });
		expect(actionButton.exists()).toBe(true);
		expect(actionButton.props('icon')).toBe('arrow_back');
	});

	test('back button navigates to backTo route', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const actionButton = wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' });
		expect(actionButton.props('to')).toBe('/back');
	});

	test('back button never calls router.back when clicked', async () => {
		const routerBackSpy = vi.spyOn(router, 'back');

		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const actionButton = wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' });
		await actionButton.trigger('click');

		expect(routerBackSpy).not.toHaveBeenCalled();
	});

	test('renders icon when icon prop is provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const icon = wrapper.findComponent({ name: 'VIcon' });
		expect(icon.exists()).toBe(true);
		expect(icon.classes()).toContain('icon-only');
	});

	test('renders VIcon with correct props when icon is provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				icon: 'edit',
				iconColor: 'blue',
			},
		});

		const icon = wrapper.findComponent({ name: 'VIcon' });
		expect(icon.exists()).toBe(true);
		expect(icon.props('name')).toBe('edit');
		expect(icon.props('color')).toBe('blue');
	});

	test('does not render back button when backTo is not provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const backButton = wrapper.find('.back-button');
		expect(backButton.exists()).toBe(false);
	});

	test('does not render icon when backTo is provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
			},
		});

		const icon = wrapper.find('.icon-only');
		expect(icon.exists()).toBe(false);
	});

	test('renders nothing when neither backTo nor icon are provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, mountOptions);

		const backButton = wrapper.find('.back-button');
		const icon = wrapper.find('.icon-only');

		expect(backButton.exists()).toBe(false);
		expect(icon.exists()).toBe(false);
	});

	test('prioritizes backTo over icon when both are provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				backTo: '/back',
				icon: 'edit',
			},
		});

		const backButton = wrapper.find('.back-button');
		const icon = wrapper.find('.icon-only');

		expect(backButton.exists()).toBe(true);
		expect(icon.exists()).toBe(false);
	});
});
