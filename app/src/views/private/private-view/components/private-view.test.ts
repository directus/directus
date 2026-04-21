import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import PrivateView from './private-view.vue';
import type { LicenseGraceType } from '@/types/license';

const { cookiesGet, userStore, settingsStore, serverStore } = vi.hoisted(() => ({
	cookiesGet: vi.fn(),
	userStore: {
		isAdmin: true,
		currentUser: {
			app_access: true,
		},
	},
	settingsStore: {
		settings: {
			project_owner: 'owner@example.com' as string | null,
		},
	},
	serverStore: {
		info: {
			setupCompleted: true,
			show_license_key_field: true,
			license_status: 'inactive',
			license_grace_type: null as LicenseGraceType,
		},
	},
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
	useCookies: () => ({
		get: cookiesGet,
	}),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => userStore,
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => settingsStore,
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => serverStore,
}));

function mountView() {
	return mount(PrivateView, {
		global: {
			stubs: {
				PrivateViewRoot: defineComponent({ template: '<div><slot /></div>' }),
				PrivateViewNoAppAccess: true,
				NotificationsDrawer: true,
				NotificationDialogs: true,
				LicenseBanner: defineComponent({ template: '<div class="owner-popup" />' }),
				LicenseGracePopup: defineComponent({ template: '<div class="grace-popup" />' }),
			},
		},
	});
}

describe('PrivateView popup arbitration', () => {
	beforeEach(() => {
		cookiesGet.mockReset();
		cookiesGet.mockReturnValue(undefined);
		userStore.isAdmin = true;
		userStore.currentUser = { app_access: true };
		settingsStore.settings = { project_owner: 'owner@example.com' };
		serverStore.info.setupCompleted = true;
		serverStore.info.show_license_key_field = true;
		serverStore.info.license_status = 'inactive';
		serverStore.info.license_grace_type = null;
	});

	test('prioritizes the owner popup over the grace popup', () => {
		settingsStore.settings = { project_owner: null };
		serverStore.info.license_status = 'grace';
		serverStore.info.license_grace_type = 'onboarding';

		const wrapper = mountView();

		expect(wrapper.find('.owner-popup').exists()).toBe(true);
		expect(wrapper.find('.grace-popup').exists()).toBe(false);
	});

	test('shows the grace popup during onboarding grace when the owner popup is not active', () => {
		serverStore.info.license_status = 'grace';
		serverStore.info.license_grace_type = 'onboarding';

		const wrapper = mountView();

		expect(wrapper.find('.grace-popup').exists()).toBe(true);
		expect(wrapper.find('.owner-popup').exists()).toBe(false);
	});

	test('suppresses the grace popup when the session skip cookie is present', () => {
		serverStore.info.license_status = 'grace';
		serverStore.info.license_grace_type = 'onboarding';
		cookiesGet.mockImplementation((key: string) => (key === 'onboarding-grace-popup-skipped' ? 'true' : undefined));

		const wrapper = mountView();

		expect(wrapper.find('.grace-popup').exists()).toBe(false);
	});
});
