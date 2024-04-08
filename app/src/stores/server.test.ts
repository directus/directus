import * as apiFunctions from '@/api';
import sdk from '@/sdk';
import * as setLanguageDefault from '@/lang/set-language';
import { User } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { Auth, Info, useServerStore } from './server';
import { useUserStore } from './user';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockServerInfo: Info = {
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
	},
};

const mockAuthProviders: Auth['providers'] = [
	{
		driver: 'oauth2',
		name: 'directus',
		label: 'Directus',
	},
];

const mockAdminUser = { id: 'e7f7a94d-5b38-4978-8450-de0e38859fec' } as User;

const mockAdminUserWithLanguage = {
	id: 'e7f7a94d-5b38-4978-8450-de0e38859fec',
	language: 'zh-CN',
} as User;

let sdkRequestSpy: MockInstance;
let replaceQueueSpy: MockInstance;
let setLanguageSpy: MockInstance;

beforeEach(() => {
	sdkRequestSpy = vi.spyOn(sdk, 'request');
	replaceQueueSpy = vi.spyOn(apiFunctions, 'replaceQueue').mockResolvedValue();
	setLanguageSpy = vi.spyOn(setLanguageDefault, 'setLanguage').mockResolvedValue(true);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('hydrate action', async () => {
	test('should hydrate info', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(serverStore.info).toEqual(mockServerInfo);
	});

	test('should hydrate auth', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				// stub as server info is not tested here
				return Promise.resolve({});
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({
					data: mockAuthProviders,
					disableDefault: true,
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

	test('should set default language en-US when there is no logged in user', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				// stub as server info is not tested here
				return Promise.resolve({});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(setLanguageSpy).toHaveBeenCalledWith('en-US');
	});

	test('should set configured default language when there is no logged in user', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(setLanguageSpy).toHaveBeenCalledWith(mockServerInfo.project?.default_language);
	});

	test('should set updated default language for admin user', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const userStore = useUserStore();
		userStore.currentUser = mockAdminUser;

		const serverStore = useServerStore();
		await serverStore.hydrate({ isLanguageUpdated: true });

		expect(setLanguageSpy).toHaveBeenCalledOnce();
	});

	test('should not set updated default language for admin user', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const userStore = useUserStore();
		userStore.currentUser = mockAdminUser;

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(setLanguageSpy).not.toHaveBeenCalled();
	});

	test('should not set updated default language for admin user with configured language', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const userStore = useUserStore();
		userStore.currentUser = mockAdminUserWithLanguage;

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(setLanguageSpy).not.toHaveBeenCalled();
	});

	test('should not call replaceQueue when there is no rateLimit', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve({});
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(replaceQueueSpy).not.toHaveBeenCalled();
	});

	test('should call replaceQueue without arguments when rateLimit is false', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve({ rateLimit: false });
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
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

		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve({ rateLimit: mockRateLimit });
			}

			if (path.startsWith('/auth')) {
				// stub as auth is not tested here
				return Promise.resolve({});
			}

			return;
		});

		const serverStore = useServerStore();
		await serverStore.hydrate();

		expect(replaceQueueSpy).toHaveBeenCalledWith({
			intervalCap: mockRateLimit.points - 10,
			interval: mockRateLimit.duration * 1000,
			carryoverConcurrencyCount: true,
		});
	});
});

describe('dehydrate action', () => {
	test('should reset store', async () => {
		sdkRequestSpy.mockImplementation((cfg: () => Record<string, any>) => {
			const { path } = cfg();

			if (path === '/server/info') {
				return Promise.resolve(mockServerInfo);
			}

			if (path.startsWith('/auth')) {
				return Promise.resolve({
					data: mockAuthProviders,
					disableDefault: true,
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
