import PrivateViewHeaderBarIcon from './private-view-header-bar-icon.vue';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

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

	test('renders back button when showBack prop is true', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
			},
		});

		const backButton = wrapper.findComponent({ name: 'VButton' });
		expect(backButton.exists()).toBe(true);
		expect(backButton.classes()).toContain('back-button');
	});

	test('back button has correct props', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
			},
		});

		const backButton = wrapper.findComponent({ name: 'VButton' });
		expect(backButton.props('rounded')).toBe(true);
		expect(backButton.props('icon')).toBe(true);
		expect(backButton.props('secondary')).toBe(true);
		expect(backButton.props('exact')).toBe(true);
		expect(backButton.props('small')).toBe(true);
	});

	test('back button renders arrow_back icon', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
			},
		});

		const icon = wrapper.findComponent({ name: 'VIcon' });
		expect(icon.exists()).toBe(true);
		expect(icon.props('name')).toBe('arrow_back');
		expect(icon.props('small')).toBe(true);
	});

	test('back button navigates to backTo route when provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
				backTo: '/back',
			},
		});

		const backButton = wrapper.findComponent({ name: 'VButton' });
		expect(backButton.props('to')).toBe('/back');
	});

	test('back button calls router.back when backTo is not provided', async () => {
		const routerBackSpy = vi.spyOn(router, 'back');

		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
			},
		});

		const backButton = wrapper.findComponent({ name: 'VButton' });

		await backButton.find('.button').trigger('click');

		expect(routerBackSpy).toHaveBeenCalled();
	});

	test('back button does not call router.back when backTo is provided', async () => {
		const routerBackSpy = vi.spyOn(router, 'back');

		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
				backTo: '/back',
			},
		});

		const backButton = wrapper.findComponent({ name: 'VButton' });
		await backButton.trigger('click');

		expect(routerBackSpy).not.toHaveBeenCalled();
	});

	test('renders icon div when icon prop is provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const iconDiv = wrapper.find('div.icon');
		expect(iconDiv.exists()).toBe(true);
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
		expect(icon.props('small')).toBe(true);
	});

	test('does not render back button when showBack is false', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				icon: 'edit',
			},
		});

		const backButton = wrapper.find('.back-button');
		expect(backButton.exists()).toBe(false);
	});

	test('does not render icon div when icon is not provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
			},
		});

		const iconDiv = wrapper.find('div.icon');
		expect(iconDiv.exists()).toBe(false);
	});

	test('renders nothing when neither showBack nor icon are provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, mountOptions);

		const backButton = wrapper.find('.back-button');
		const iconDiv = wrapper.find('div.icon');

		expect(backButton.exists()).toBe(false);
		expect(iconDiv.exists()).toBe(false);
	});

	test('prioritizes showBack over icon when both are provided', () => {
		const wrapper = mount(PrivateViewHeaderBarIcon, {
			...mountOptions,
			props: {
				showBack: true,
				icon: 'edit',
			},
		});

		const backButton = wrapper.find('.back-button');
		const iconDiv = wrapper.find('div.icon');

		expect(backButton.exists()).toBe(true);
		expect(iconDiv.exists()).toBe(false);
	});
});
