import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { expect, test } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import VSkeletonLoader from './v-skeleton-loader.vue';

test('Mount component', () => {
	expect(VSkeletonLoader).toBeTruthy();

	const pinia = createPinia();

	const router = createRouter({
		history: createMemoryHistory(),
		routes: [],
	});

	const wrapper = mount(VSkeletonLoader, {
		props: {
			type: 'list-item-icon',
		},
		global: {
			plugins: [pinia, router],
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('type prop', () => {
	const types = [
		'input',
		'input-tall',
		'block-list-item',
		'block-list-item-dense',
		'text',
		'list-item-icon',
		'pagination',
	] as const;

	const pinia = createPinia();

	const router = createRouter({
		history: createMemoryHistory(),
		routes: [],
	});

	for (const type of types) {
		const wrapper = mount(VSkeletonLoader, {
			props: {
				type,
			},
			global: {
				plugins: [pinia, router],
			},
		});

		expect(wrapper.classes()).toContain(type);
	}
});
