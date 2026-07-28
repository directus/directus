import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './app.vue';

const { mockUseHead } = vi.hoisted(() => ({
	mockUseHead: vi.fn(),
}));

vi.mock('@unhead/vue', () => ({
	useHead: mockUseHead,
}));

vi.mock('@/api', () => {
	const api = {
		get: vi.fn(),
		interceptors: {
			request: { use: vi.fn() },
			response: { use: vi.fn() },
		},
	};

	return {
		default: api,
		replaceQueue: vi.fn().mockResolvedValue(undefined),
		resumeQueue: vi.fn(),
	};
});

vi.mock('@/components/v-button.vue', () => ({
	default: { name: 'VButton', template: '<button><slot /></button>' },
}));

vi.mock('@/components/v-error.vue', () => ({
	default: { name: 'VError', template: '<div class="v-error" />' },
}));

vi.mock('@/components/v-info.vue', () => ({
	default: { name: 'VInfo', template: '<div class="v-info"><slot /></div>' },
}));

vi.mock('@/components/v-progress-circular.vue', () => ({
	default: { name: 'VProgressCircular', template: '<div class="v-progress-circular" />' },
}));

vi.mock('@/idle', () => ({
	startIdleTracking: vi.fn(),
	stopIdleTracking: vi.fn(),
}));

const { mockGetRootPath } = vi.hoisted(() => ({
	mockGetRootPath: vi.fn(() => '/custom/'),
}));

vi.mock('@/utils/get-root-path', async (importOriginal) => {
	const mod = await importOriginal<typeof import('@/utils/get-root-path')>();

	return {
		...mod,
		getRootPath: mockGetRootPath,
	};
});

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

vi.spyOn(i18n.global, 't').mockImplementation((key) => String(key));

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
});

describe('App default favicon', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
				initialState: {
					appStore: {
						hydrating: false,
						error: null,
					},
					serverStore: {
						info: {
							project: {
								project_name: 'Directus',
								project_descriptor: null,
								project_logo: null,
								project_color: null,
								default_language: 'de-DE',
								default_appearance: 'auto',
								default_theme_light: null,
								default_theme_dark: null,
								theme_light_overrides: null,
								theme_dark_overrides: null,
								public_foreground: null,
								public_background: null,
								public_favicon: null,
								public_note: null,
								custom_css: null,
								public_registration: null,
								public_registration_verify_email: null,
							},
							mcp_enabled: false,
							ai_enabled: false,
							setupCompleted: true,
						},
					},
				},
			}),
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('uses getRootPath when no custom favicon or project color is set', async () => {
		const appStore = useAppStore();
		appStore.hydrating = false;
		appStore.error = null;

		const wrapper = mount(App, {
			shallow: true,
			global: {
				plugins: [i18n, router],
				stubs: {
					ThemeProvider: { template: '<div><slot /></div>' },
					RouterView: { template: '<div />' },
					Teleport: true,
				},
			},
		});

		expect(mockUseHead).toHaveBeenCalledOnce();

		const headConfig = mockUseHead.mock.calls[0]![0];
		const linkComputed = headConfig.link;
		const links = linkComputed.value;

		expect(links).toEqual([{ rel: 'icon', href: '/custom/favicon.ico' }]);
		expect(mockGetRootPath).toHaveBeenCalled();

		wrapper.unmount();
	});
});
