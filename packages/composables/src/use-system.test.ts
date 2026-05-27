import { API_INJECT, EXTENSIONS_INJECT, SDK_INJECT, STORES_INJECT } from '@directus/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inject } from 'vue';
import { useApi, useExtensions, useSdk, useStores } from './use-system.js';

// Mock Vue's inject function
vi.mock('vue', () => ({
	inject: vi.fn(),
}));

const mockInject = vi.mocked(inject);

describe('use-system', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('useStores', () => {
		it('should return stores when successfully injected', () => {
			const mockStores = {
				useUserStore: vi.fn(),
				useCollectionsStore: vi.fn(),
				usePermissionsStore: vi.fn(),
				useFieldsStore: vi.fn(),
			};

			mockInject.mockReturnValue(mockStores);

			const result = useStores();

			expect(mockInject).toHaveBeenCalledWith(STORES_INJECT);
			expect(result).toBe(mockStores);
		});

		it('should throw error when stores injection fails', () => {
			mockInject.mockReturnValue(undefined);

			expect(() => useStores()).toThrow('[useStores]: The stores could not be found.');
			expect(mockInject).toHaveBeenCalledWith(STORES_INJECT);
		});

		it('should throw error when stores injection returns null', () => {
			mockInject.mockReturnValue(null);

			expect(() => useStores()).toThrow('[useStores]: The stores could not be found.');
			expect(mockInject).toHaveBeenCalledWith(STORES_INJECT);
		});

		it('should return empty object when injected stores is empty', () => {
			const emptyStores = {};
			mockInject.mockReturnValue(emptyStores);

			const result = useStores();

			expect(result).toBe(emptyStores);
			expect(result).toEqual({});
		});

		it('should preserve store methods and properties', () => {
			const mockStores = {
				useUserStore: vi.fn(() => ({
					currentUser: { id: '1', name: 'Test User' },
					login: vi.fn(),
					logout: vi.fn(),
				})),
				useCollectionsStore: vi.fn(() => ({
					collections: [{ collection: 'articles' }],
					refresh: vi.fn(),
				})),
			};

			mockInject.mockReturnValue(mockStores);

			const result = useStores();

			expect(result['useUserStore']).toBe(mockStores.useUserStore);
			expect(result['useCollectionsStore']).toBe(mockStores.useCollectionsStore);
		});
	});

	describe('useApi', () => {
		it('should return axios instance when successfully injected', () => {
			const mockApi = {
				get: vi.fn(),
				post: vi.fn(),
				put: vi.fn(),
				delete: vi.fn(),
				patch: vi.fn(),
				request: vi.fn(),
				defaults: {
					baseURL: 'https://api.directus.example.com',
					headers: { Authorization: 'Bearer token' },
				},
			};

			mockInject.mockReturnValue(mockApi);

			const result = useApi();

			expect(mockInject).toHaveBeenCalledWith(API_INJECT);
			expect(result).toBe(mockApi);
		});

		it('should throw error when api injection fails', () => {
			mockInject.mockReturnValue(undefined);

			expect(() => useApi()).toThrow('[useApi]: The api could not be found.');
			expect(mockInject).toHaveBeenCalledWith(API_INJECT);
		});

		it('should throw error when api injection returns null', () => {
			mockInject.mockReturnValue(null);

			expect(() => useApi()).toThrow('[useApi]: The api could not be found.');
			expect(mockInject).toHaveBeenCalledWith(API_INJECT);
		});

		it('should preserve axios methods and configuration', () => {
			const mockApi = {
				get: vi.fn().mockResolvedValue({ data: { data: [] } }),
				post: vi.fn().mockResolvedValue({ data: { data: {} } }),
				interceptors: {
					request: { use: vi.fn() },
					response: { use: vi.fn() },
				},
				defaults: { timeout: 5000 },
			};

			mockInject.mockReturnValue(mockApi);

			const result = useApi();

			expect(result.get).toBe(mockApi.get);
			expect(result.post).toBe(mockApi.post);
			expect(result.interceptors).toBe(mockApi.interceptors);
			expect(result.defaults).toBe(mockApi.defaults);
		});

		it('should work with configured base URL and headers', () => {
			const mockApi = {
				get: vi.fn(),
				defaults: {
					baseURL: 'https://api.example.com',
					headers: {
						common: { Authorization: 'Bearer test-token' },
						'Content-Type': 'application/json',
					},
				},
			};

			mockInject.mockReturnValue(mockApi);

			const result = useApi();

			expect(result.defaults.baseURL).toBe('https://api.example.com');
			expect(result.defaults.headers.common['Authorization']).toBe('Bearer test-token');
		});
	});

	describe('useSdk', () => {
		it('should return sdk instance when successfully injected', () => {
			const mockSdk = {
				request: vi.fn(),
				url: new URL('https://api.example.com'),
				with: vi.fn(),
				auth: {
					login: vi.fn(),
					logout: vi.fn(),
					refresh: vi.fn(),
				},
			};

			mockInject.mockReturnValue(mockSdk);

			const result = useSdk();

			expect(mockInject).toHaveBeenCalledWith(SDK_INJECT);
			expect(result).toBe(mockSdk);
		});

		it('should throw error when sdk injection fails', () => {
			mockInject.mockReturnValue(undefined);

			expect(() => useSdk()).toThrow('[useSdk]: The sdk could not be found.');
			expect(mockInject).toHaveBeenCalledWith(SDK_INJECT);
		});

		it('should throw error when sdk injection returns null', () => {
			mockInject.mockReturnValue(null);

			expect(() => useSdk()).toThrow('[useSdk]: The sdk could not be found.');
			expect(mockInject).toHaveBeenCalledWith(SDK_INJECT);
		});

		it('should work with typed schema', () => {
			interface TestSchema {
				articles: {
					id: string;
					title: string;
					content: string;
				};
			}

			const mockSdk = {
				request: vi.fn(),
				url: new URL('https://api.example.com'),
				with: vi.fn(),
				auth: { login: vi.fn() },
			};

			mockInject.mockReturnValue(mockSdk);

			const result = useSdk<TestSchema>();

			expect(result).toBe(mockSdk);
		});

		it('should preserve sdk methods and authentication', () => {
			const mockSdk = {
				request: vi.fn(),
				url: new URL('https://api.example.com'),
				with: vi.fn(),
				auth: {
					login: vi.fn().mockResolvedValue({ access_token: 'token' }),
					logout: vi.fn().mockResolvedValue(undefined),
					refresh: vi.fn().mockResolvedValue({ access_token: 'new-token' }),
				},
			};

			mockInject.mockReturnValue(mockSdk);

			const result = useSdk();

			expect(result.request).toBe(mockSdk.request);
			expect((result as any).auth).toBe(mockSdk.auth);
			expect(result.url).toEqual(new URL('https://api.example.com'));
		});

		it('should work with default generic type', () => {
			const mockSdk = {
				request: vi.fn(),
				url: new URL('https://api.example.com'),
				with: vi.fn(),
			};

			mockInject.mockReturnValue(mockSdk);

			// Should work without explicit type parameter
			const result = useSdk();

			expect(result).toBe(mockSdk);
		});
	});

	describe('useExtensions', () => {
		it('should return extensions when successfully injected', () => {
			const mockExtensions = {
				interfaces: {
					input: { name: 'Input', icon: 'text_fields' },
					textarea: { name: 'Textarea', icon: 'text_snippet' },
				},
				displays: {
					text: { name: 'Text', icon: 'title' },
					datetime: { name: 'DateTime', icon: 'schedule' },
				},
				layouts: {
					tabular: { name: 'Table', icon: 'reorder' },
					cards: { name: 'Cards', icon: 'grid_view' },
				},
				modules: {
					content: { name: 'Content', icon: 'article' },
					users: { name: 'User Management', icon: 'people' },
				},
			};

			mockInject.mockReturnValue(mockExtensions);

			const result = useExtensions();

			expect(mockInject).toHaveBeenCalledWith(EXTENSIONS_INJECT);
			expect(result).toBe(mockExtensions);
		});

		it('should throw error when extensions injection fails', () => {
			mockInject.mockReturnValue(undefined);

			expect(() => useExtensions()).toThrow('[useExtensions]: The extensions could not be found.');
			expect(mockInject).toHaveBeenCalledWith(EXTENSIONS_INJECT);
		});

		it('should throw error when extensions injection returns null', () => {
			mockInject.mockReturnValue(null);

			expect(() => useExtensions()).toThrow('[useExtensions]: The extensions could not be found.');
			expect(mockInject).toHaveBeenCalledWith(EXTENSIONS_INJECT);
		});

		it('should return empty extensions object', () => {
			const emptyExtensions = {};
			mockInject.mockReturnValue(emptyExtensions);

			const result = useExtensions();

			expect(result).toBe(emptyExtensions);
			expect(result).toEqual({});
		});

		it('should preserve extension configurations', () => {
			const mockExtensions = {
				interfaces: {
					'custom-input': {
						name: 'Custom Input',
						icon: 'custom_icon',
						component: 'CustomInputInterface',
						options: ['option1', 'option2'],
					},
				},
				operations: {
					'custom-operation': {
						name: 'Custom Operation',
						icon: 'custom_op_icon',
						overview: {
							label: 'Custom Operation',
							group: 'custom',
						},
					},
				},
			};

			mockInject.mockReturnValue(mockExtensions);

			const result = useExtensions();

			expect(result.interfaces).toBe(mockExtensions.interfaces);
			expect(result.operations).toBe(mockExtensions.operations);
			// Use any type to avoid complex type checking in tests
			expect((result as any).interfaces['custom-input'].name).toBe('Custom Input');
			expect((result as any).operations['custom-operation'].overview.group).toBe('custom');
		});

		it('should handle partial extension configurations', () => {
			const mockExtensions = {
				interfaces: {
					'text-input': { name: 'Text Input', icon: 'text' },
				},
				// Missing other extension types
			};

			mockInject.mockReturnValue(mockExtensions);

			const result = useExtensions();

			expect(result.interfaces).toBeDefined();
			expect((result as any).interfaces['text-input']).toBeDefined();
			expect((result as any).displays).toBeUndefined();
			expect((result as any).layouts).toBeUndefined();
		});

		it('should work with complex extension configurations', () => {
			const mockExtensions = {
				panels: {
					'metric-panel': {
						name: 'Metric Panel',
						icon: 'analytics',
						component: 'MetricPanel',
						options: {
							color: 'string',
							metric: 'string',
							conditionalFormatting: 'json',
						},
						minWidth: 12,
						minHeight: 8,
					},
				},
			};

			mockInject.mockReturnValue(mockExtensions);

			const result = useExtensions();

			expect((result as any).panels['metric-panel'].minWidth).toBe(12);
		});
	});

	describe('integration scenarios', () => {
		it('should handle all composables being used together', () => {
			const mockStores = { useUserStore: vi.fn() };
			const mockApi = { get: vi.fn() };
			const mockSdk = { request: vi.fn() };
			const mockExtensions = { interfaces: {} };

			mockInject
				.mockReturnValueOnce(mockStores)
				.mockReturnValueOnce(mockApi)
				.mockReturnValueOnce(mockSdk)
				.mockReturnValueOnce(mockExtensions);

			const stores = useStores();
			const api = useApi();
			const sdk = useSdk();
			const extensions = useExtensions();

			expect(stores).toBe(mockStores);
			expect(api).toBe(mockApi);
			expect(sdk).toBe(mockSdk);
			expect(extensions).toBe(mockExtensions);

			expect(mockInject).toHaveBeenCalledTimes(4);
			expect(mockInject).toHaveBeenNthCalledWith(1, STORES_INJECT);
			expect(mockInject).toHaveBeenNthCalledWith(2, API_INJECT);
			expect(mockInject).toHaveBeenNthCalledWith(3, SDK_INJECT);
			expect(mockInject).toHaveBeenNthCalledWith(4, EXTENSIONS_INJECT);
		});

		it('should maintain independence when one injection fails', () => {
			const mockStores = { useUserStore: vi.fn() };

			mockInject
				.mockReturnValueOnce(mockStores) // useStores succeeds
				.mockReturnValueOnce(undefined); // useApi fails

			const stores = useStores();
			expect(stores).toBe(mockStores);

			expect(() => useApi()).toThrow('[useApi]: The api could not be found.');
		});
	});
});
