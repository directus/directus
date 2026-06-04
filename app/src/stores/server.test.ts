import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { Auth, useServerStore } from './server';
import api, * as apiFunctions from '@/api';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockServerInfo = {
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
	license: null,
	mcp_enabled: true,
	ai_enabled: true,
	mcp_oauth_enabled: true,
	mcp_oauth_dcr_enabled: false,
	mcp_oauth_cimd_enabled: true,
	setupCompleted: true,
};

const mockAuthProviders: Auth['providers'] = [
	{
		driver: 'oauth2',
		name: 'directus',
		label: 'Directus',
	},
];

let apiGetSpy: MockInstance;
let replaceQueueSpy: MockInstance;

beforeEach(() => {
	apiGetSpy = vi.spyOn(api, 'get');
	replaceQueueSpy = vi.spyOn(apiFunctions, 'replaceQueue').mockResolvedValue();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('hydrate action', async () => {
	test('should hydrate info', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: mockServerInfo,
					},
				});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(serverStore.info.project).toEqual(mockServerInfo.project);
		expect(serverStore.info.license).toEqual(mockServerInfo.license);
	});

	test('should hydrate MCP OAuth env capability flags', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: {
							mcp_oauth_enabled: true,
							mcp_oauth_dcr_enabled: false,
							mcp_oauth_cimd_enabled: true,
						},
					},
				});
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(serverStore.info.mcp_oauth_enabled).toBe(true);
		expect(serverStore.info.mcp_oauth_dcr_enabled).toBe(false);
		expect(serverStore.info.mcp_oauth_cimd_enabled).toBe(true);
	});

	test('should hydrate auth', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				// stub as server info is not tested here
				return Promise.resolve({ data: {} });
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({
					data: {
						data: mockAuthProviders,
						disableDefault: true,
					},
				});
			}

			return;
		});

		const serverStore = useServerStore();

		// test initial values
		expect(serverStore.auth.providers).toEqual([]);
		expect(serverStore.auth.disableDefault).toEqual(false);

		await serverStore.hydrate();

		expect(serverStore.auth.providers).toEqual(mockAuthProviders);
		expect(serverStore.auth.disableDefault).toEqual(true);
	});

	test('should not call replaceQueue when there is no rateLimit', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: {},
					},
				});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(replaceQueueSpy).not.toHaveBeenCalled();
	});

	test('should call replaceQueue without arguments when rateLimit is false', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: { rateLimit: false },
					},
				});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(replaceQueueSpy).toHaveBeenCalledWith();
	});

	test('should call replaceQueue with arguments when rateLimit is configured', async () => {
		const mockRateLimit = {
			duration: 10,
			points: 20,
		};

		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: {
							rateLimit: mockRateLimit,
						},
					},
				});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(replaceQueueSpy).toHaveBeenCalledWith({
			intervalCap: 1,
			// Interval for 1 point (duration * 1000(ms) / points)
			interval: 500,
		});
	});

	test('setupCompleted is true when /info response has no setup key', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({ data: { data: { ...mockServerInfo } } });
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(serverStore.info.setupCompleted).toBe(true);
	});

	test('setupCompleted is false when /info response has a setup key', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: { ...mockServerInfo, setup: { license_complete: false, owner_complete: false } },
					},
				});
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({ data: {} });
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(serverStore.info.setupCompleted).toBe(false);
	});
});

describe('dehydrate action', () => {
	test('should reset store', async () => {
		apiGetSpy.mockImplementation((path: string) => {
			if (path === '/server/info') {
				return Promise.resolve({
					data: {
						data: mockServerInfo,
					},
				});
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({
					data: {
						data: mockAuthProviders,
						disableDefault: true,
					},
				});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();
		serverStore.dehydrate();

		expect(serverStore.info.project).toEqual(null);
		expect(serverStore.auth.providers).toEqual([]);
		expect(serverStore.auth.disableDefault).toEqual(false);
	});
});
