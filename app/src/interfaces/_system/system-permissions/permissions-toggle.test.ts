import type { Permission } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PermissionsToggle from './permissions-toggle.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import type { Collection } from '@/types/collections';

const collection = { collection: 'directus_extensions', name: 'Extensions' } as Collection;
const permission = { collection: 'directus_extensions', action: 'update', fields: ['*'] } as Permission;

const passthrough = { template: '<div><slot /></div>' };

// The shared no-op Tooltip can't assert the copy, so expose the bound value on the element instead.
const tooltip = {
	mounted(el: HTMLElement, { value }: { value: string }) {
		el.dataset.tooltip = value;
	},
};

let global: GlobalMountOptions;

beforeEach(() => {
	const pinia = createTestingPinia({ createSpy: vi.fn });
	setActivePinia(pinia);

	global = {
		plugins: [pinia],
		directives: { tooltip },
		mocks: {
			$t: (key: string, params?: Record<string, string>) =>
				params ? `${key}:${params.action}:${params.collection}` : key,
		},
		stubs: {
			'v-chip': {
				props: { disabled: Boolean },
				template: '<span class="chip" :data-disabled="disabled"><slot /></span>',
			},
			'v-menu': {
				template: '<div><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
			},
			'v-list-item': { template: '<div class="list-item"><slot /></div>' },
			'v-list': passthrough,
			'v-list-item-icon': passthrough,
			'v-list-item-content': passthrough,
			'v-icon': true,
			'v-divider': true,
			'v-progress-circular': true,
			'license-upgrade-modal': true,
		},
	};
});

describe('restricted action', () => {
	test('renders an inert chip when no permission is stored', () => {
		const wrapper = mount(PermissionsToggle, {
			props: { collection, action: 'update', restricted: true },
			global,
		});

		expect(wrapper.find('.chip').attributes('data-disabled')).toBe('true');
		expect(wrapper.find('.list-item').exists()).toBe(false);
		expect(wrapper.attributes('data-tooltip')).toBe('hardcoded_admin_only_action_note:update:Extensions');
	});

	test('offers removal when a permission is stored', async () => {
		const wrapper = mount(PermissionsToggle, {
			props: { collection, action: 'update', restricted: true, permission },
			global,
		});

		expect(wrapper.find('.chip').classes()).toContain('stale');
		expect(wrapper.attributes('data-tooltip')).toBe('hardcoded_admin_only_stale_permission_note:update:Extensions');
		expect(wrapper.findAll('.list-item')).toHaveLength(1);
		expect(wrapper.find('.list-item').text()).toBe('remove_permission');

		await wrapper.find('.list-item').trigger('click');

		expect(wrapper.emitted('setNoAccess')).toHaveLength(1);
		expect(wrapper.emitted('setFullAccess')).toBeUndefined();
		expect(wrapper.emitted('edit')).toBeUndefined();
	});
});

describe('unrestricted action', () => {
	test('keeps the regular access menu when a permission is stored', () => {
		const wrapper = mount(PermissionsToggle, {
			props: { collection, action: 'update', permission },
			global,
		});

		expect(wrapper.find('.chip').classes()).not.toContain('stale');
		expect(wrapper.text()).not.toContain('remove_permission');
		expect(wrapper.findAll('.list-item').length).toBeGreaterThan(1);
	});
});

describe('action that requires an authenticated user', () => {
	const commentsCollection = { collection: 'directus_comments', name: 'Comments' } as Collection;
	const commentsPermission = { collection: 'directus_comments', action: 'create', fields: ['*'] } as Permission;

	test('explains a stored permission in the tooltip and keeps the regular access menu', () => {
		const wrapper = mount(PermissionsToggle, {
			props: { collection: commentsCollection, action: 'create', requiresUser: true, permission: commentsPermission },
			global,
		});

		expect(wrapper.attributes('data-tooltip')).toBe('hardcoded_user_only_action_note:create:Comments');
		expect(wrapper.text()).not.toContain('remove_permission');
		expect(wrapper.findAll('.list-item').length).toBeGreaterThan(1);
	});

	test('uses the regular tooltip when no permission is stored', () => {
		const wrapper = mount(PermissionsToggle, {
			props: { collection: commentsCollection, action: 'create', requiresUser: true },
			global,
		});

		expect(wrapper.attributes('data-tooltip')).not.toContain('hardcoded_user_only_action_note');
	});
});
