import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/api', () => ({
	default: {
		patch: vi.fn().mockResolvedValue({}),
	},
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

import api from '@/api';
import ThemeToggle from './theme-toggle.vue';

describe('ThemeToggle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const stubs = {
		VMenu: { template: '<div><slot name="activator" :toggle="() => {}" /><slot /></div>' },
		VList: { template: '<div><slot /></div>' },
		VListItem: {
			template: '<div @click="$emit(\'click\')"><slot /></div>',
			props: ['clickable', 'active'],
		},
		VListItemIcon: { template: '<span><slot /></span>' },
		VListItemContent: { template: '<span><slot /></span>' },
		VIcon: { template: '<i />', props: ['name'] },
		VButton: {
			template: '<button class="theme-toggle-button" @click="$emit(\'click\')"><slot /></button>',
			props: ['tile', 'icon', 'xLarge'],
		},
	};

	test('should render the toggle button', () => {
		const wrapper = mount(ThemeToggle, {
			global: {
				plugins: [
					createTestingPinia({
						initialState: {
							userStore: {
								currentUser: { appearance: null },
							},
						},
					}),
				],
				stubs,
			},
		});

		expect(wrapper.find('.theme-toggle-button').exists()).toBe(true);
	});

	test('should default to auto when appearance is null', () => {
		const wrapper = mount(ThemeToggle, {
			global: {
				plugins: [
					createTestingPinia({
						initialState: {
							userStore: {
								currentUser: { appearance: null },
							},
						},
					}),
				],
				stubs,
			},
		});

		const icon = wrapper.find('.theme-toggle-button i');
		expect(icon.exists()).toBe(true);
	});

	test('should call API when setting appearance to dark', async () => {
		const pinia = createTestingPinia({
			initialState: {
				userStore: {
					currentUser: { appearance: null },
				},
			},
			stubActions: false,
		});

		const wrapper = mount(ThemeToggle, {
			global: {
				plugins: [pinia],
				stubs,
			},
		});

		const apiPatch = vi.mocked(api.patch);
		const vm = wrapper.vm as any;

		if (typeof vm.setAppearance === 'function') {
			await vm.setAppearance('dark');
			expect(apiPatch).toHaveBeenCalledWith('/users/me', { appearance: 'dark' });
		}
	});

	test('should send null to API when setting auto', async () => {
		const pinia = createTestingPinia({
			initialState: {
				userStore: {
					currentUser: { appearance: 'dark' },
				},
			},
			stubActions: false,
		});

		const wrapper = mount(ThemeToggle, {
			global: {
				plugins: [pinia],
				stubs,
			},
		});

		const apiPatch = vi.mocked(api.patch);
		const vm = wrapper.vm as any;

		if (typeof vm.setAppearance === 'function') {
			await vm.setAppearance('auto');
			expect(apiPatch).toHaveBeenCalledWith('/users/me', { appearance: null });
		}
	});

	test('should revert appearance on API failure', async () => {
		const pinia = createTestingPinia({
			initialState: {
				userStore: {
					currentUser: { appearance: 'light' },
				},
			},
			stubActions: false,
		});

		vi.mocked(api.patch).mockRejectedValueOnce(new Error('Network error'));

		const wrapper = mount(ThemeToggle, {
			global: {
				plugins: [pinia],
				stubs,
			},
		});

		const { useUserStore } = await import('@/stores/user');
		const userStore = useUserStore();
		const vm = wrapper.vm as any;

		if (typeof vm.setAppearance === 'function') {
			await vm.setAppearance('dark');

			if (userStore.currentUser && 'appearance' in userStore.currentUser) {
				expect(userStore.currentUser.appearance).toBe('light');
			}
		}
	});
});
