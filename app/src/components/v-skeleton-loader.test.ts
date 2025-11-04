import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';

import VSkeletonLoader from './v-skeleton-loader.vue';

test('Mount component', () => {
	expect(VSkeletonLoader).toBeTruthy();

	const wrapper = mount(VSkeletonLoader, {
		props: {
			type: 'list-item-icon',
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

	for (const type of types) {
		const wrapper = mount(VSkeletonLoader, {
			props: {
				type,
			},
		});

		expect(wrapper.classes()).toContain(type);
	}
});
