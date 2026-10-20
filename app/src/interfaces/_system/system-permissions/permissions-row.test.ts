import type { Permission } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import PermissionsRow from './permissions-row.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import type { Collection } from '@/types/collections';

const collection = { collection: 'directus_comments', name: 'Comments' } as Collection;
const permissions = [{ collection: 'directus_comments', action: 'create', fields: ['*'] }] as Permission[];

const tooltip = {
	mounted(el: HTMLElement, { value }: { value: string }) {
		el.dataset.tooltip = value;
	},
};

const global: GlobalMountOptions = {
	directives: { tooltip },
	mocks: {
		$t: (key: string, params?: Record<string, string>) =>
			params ? `${key}:${params.actions}:${params.collection}` : key,
	},
	stubs: { PermissionsToggle: true, VIcon: true },
};

describe('user-only warning', () => {
	test('shows on a collection with a stored permission the API restricts to authenticated users', () => {
		const wrapper = mount(PermissionsRow, {
			props: { collection, permissions, userOnlyActions: ['create', 'update', 'delete'] },
			global,
		});

		const icon = wrapper.find('v-icon-stub[name="warning"]');

		expect(icon.exists()).toBe(true);
		expect(icon.attributes('data-tooltip')).toBe('hardcoded_user_only_collection_note:create:Comments');
	});

	test('is hidden when the policy is not attached to the public role', () => {
		const wrapper = mount(PermissionsRow, { props: { collection, permissions }, global });

		expect(wrapper.find('v-icon-stub[name="warning"]').exists()).toBe(false);
	});

	test('is hidden when none of the restricted actions has a stored permission', () => {
		const wrapper = mount(PermissionsRow, {
			props: { collection, permissions: [], userOnlyActions: ['create', 'update', 'delete'] },
			global,
		});

		expect(wrapper.find('v-icon-stub[name="warning"]').exists()).toBe(false);
	});
});
