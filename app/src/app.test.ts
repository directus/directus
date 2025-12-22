import type { GlobalMountOptions } from '@/__utils__/types';
import { useServerStore } from '@/stores/server';
import { generateFavicon } from '@/utils/generate-favicon';
import { getAssetUrl } from '@/utils/get-asset-url';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createHead } from '@unhead/vue';
import { nextTick } from 'vue';
import App from './app.vue';

vi.mock('@/utils/generate-favicon');
vi.mock('@/utils/get-asset-url');
vi.mock('@/composables/use-system', () => ({
	useSystem: vi.fn(),
}));
vi.mock('./idle', () => ({
	startIdleTracking: vi.fn(),
	stopIdleTracking: vi.fn(),
}));

const i18n = createI18n({ legacy: false });

const global: GlobalMountOptions = {
	plugins: [i18n, createHead()],
	stubs: {
		RouterView: true,
		ThemeProvider: true,
		VButton: true,
		VError: true,
		VInfo: true,
		VProgressCircular: true,
	},
};

// silences locale message not found warnings
vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

describe('App - Favicon Management', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
			}),
		);

		// Clear DOM before each test
		document.head.innerHTML = '';
		document.body.innerHTML = '';

		// Add custom-css element for Teleport
		const customCssElement = document.createElement('div');
		customCssElement.id = 'custom-css';
		document.body.appendChild(customCssElement);

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up DOM after each test
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	describe('Prevent default favicon from showing before custom favicon loads', () => {
		test('should not set any favicon when serverStore.info is null', async () => {
			const serverStore = useServerStore();
			serverStore.info = null as any;

			mount(App, { global });

			await nextTick();

			// Should not have any favicon link tags in the DOM
			const faviconLinks = document.querySelectorAll('link[rel="icon"]');
			expect(faviconLinks).toHaveLength(0);
		});

		test('should not set any favicon when serverStore.info is undefined', async () => {
			const serverStore = useServerStore();
			serverStore.info = undefined as any;

			mount(App, { global });

			await nextTick();

			// Should not have any favicon link tags in the DOM
			const faviconLinks = document.querySelectorAll('link[rel="icon"]');
			expect(faviconLinks).toHaveLength(0);
		});

		test('should remove existing favicon links when server info is loaded', async () => {
			const serverStore = useServerStore();

			// Create existing favicon links in the DOM
			const tempFavicon = document.createElement('link');
			tempFavicon.id = 'temp-favicon';
			tempFavicon.rel = 'icon';
			tempFavicon.href = '/temp-favicon.ico';
			document.head.appendChild(tempFavicon);

			const existingFavicon = document.createElement('link');
			existingFavicon.rel = 'icon';
			existingFavicon.href = '/old-favicon.ico';
			document.head.appendChild(existingFavicon);

			// Verify favicons exist before
			expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(2);
			expect(document.getElementById('temp-favicon')).toBeTruthy();

			// Set server info to trigger watchEffect
			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: '#6644ff',
					project_logo: null,
				},
			} as any;

			vi.mocked(generateFavicon).mockReturnValue('data:image/svg+xml;base64,test');

			mount(App, { global });

			// Wait for nextTick to ensure DOM manipulation happens
			await nextTick();
			await nextTick(); // Extra tick for watchEffect

			// Verify favicons are removed
			expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(0);
			expect(document.getElementById('temp-favicon')).toBeNull();
		});

		test('should remove temp favicon when it exists', async () => {
			const serverStore = useServerStore();

			// Create temp favicon
			const tempFavicon = document.createElement('link');
			tempFavicon.id = 'temp-favicon';
			tempFavicon.rel = 'icon';
			tempFavicon.href = '/temp-favicon.ico';
			document.head.appendChild(tempFavicon);

			expect(document.getElementById('temp-favicon')).toBeTruthy();

			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: '#6644ff',
					project_logo: null,
				},
			} as any;

			vi.mocked(generateFavicon).mockReturnValue('data:image/svg+xml;base64,test');

			mount(App, { global });

			await nextTick();
			await nextTick();

			expect(document.getElementById('temp-favicon')).toBeNull();
		});

		test('should set favicon using public_favicon when available', async () => {
			const serverStore = useServerStore();
			const mockFaviconUrl = 'https://example.com/favicon.png';

			serverStore.info = {
				project: {
					public_favicon: 'favicon-id',
					project_color: null,
					project_logo: null,
				},
			} as any;

			vi.mocked(getAssetUrl).mockReturnValue(mockFaviconUrl);

			mount(App, { global });

			await nextTick();

			expect(getAssetUrl).toHaveBeenCalledWith('favicon-id', { cacheBuster: true });
		});

		test('should set favicon using generated favicon when project_color is available', async () => {
			const serverStore = useServerStore();
			const mockGeneratedFavicon = 'data:image/svg+xml;base64,generated-favicon';

			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: '#6644ff',
					project_logo: null,
				},
			} as any;

			vi.mocked(generateFavicon).mockReturnValue(mockGeneratedFavicon);

			mount(App, { global });

			await nextTick();

			expect(generateFavicon).toHaveBeenCalledWith('#6644ff', true);
		});

		test('should set favicon using generated favicon with logo when project_logo exists', async () => {
			const serverStore = useServerStore();
			const mockGeneratedFavicon = 'data:image/svg+xml;base64,generated-favicon-with-logo';

			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: '#6644ff',
					project_logo: 'logo-id',
				},
			} as any;

			vi.mocked(generateFavicon).mockReturnValue(mockGeneratedFavicon);

			mount(App, { global });

			await nextTick();

			// When project_logo exists, addDirectusLogo should be false
			expect(generateFavicon).toHaveBeenCalledWith('#6644ff', false);
		});

		test('should fallback to default favicon when no custom options are available', async () => {
			const serverStore = useServerStore();

			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: null,
					project_logo: null,
				},
			} as any;

			mount(App, { global });

			await nextTick();

			// Should not call generateFavicon or getAssetUrl
			expect(generateFavicon).not.toHaveBeenCalled();
			expect(getAssetUrl).not.toHaveBeenCalled();
		});

		test('should handle multiple existing favicon links removal', async () => {
			const serverStore = useServerStore();

			// Create multiple favicon links
			for (let i = 0; i < 3; i++) {
				const favicon = document.createElement('link');
				favicon.rel = 'icon';
				favicon.href = `/favicon-${i}.ico`;
				document.head.appendChild(favicon);
			}

			expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(3);

			serverStore.info = {
				project: {
					public_favicon: null,
					project_color: '#6644ff',
					project_logo: null,
				},
			} as any;

			vi.mocked(generateFavicon).mockReturnValue('data:image/svg+xml;base64,test');

			mount(App, { global });

			await nextTick();
			await nextTick();

			// All favicon links should be removed
			expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(0);
		});
	});
});
