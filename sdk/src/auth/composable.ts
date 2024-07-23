import { getAuthEndpoint } from '../rest/utils/get-auth-endpoint.js';
import type { DirectusClient } from '../types/client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type {
	AuthenticationClient,
	AuthenticationConfig,
	AuthenticationData,
	AuthenticationMode,
	LoginOptions,
} from './types.js';
import { memoryStorage } from './utils/memory-storage.js';

const defaultConfigValues: AuthenticationConfig = {
	msRefreshBeforeExpires: 30000, // 30 seconds
	autoRefresh: true,
};

/**
 * setTimeout breaks with numbers bigger than 32bits.
 * This ensures that we don't try refreshing for tokens that last > 24 days.
 * Ref #4054
 */
const MAX_INT32 = 2 ** 31 - 1;

/**
 * Creates a client to authenticate with Directus.
 *
 * @param mode AuthenticationMode
 * @param config The optional configuration.
 *
 * @returns A Directus authentication client.
 */
export const authentication = (mode: AuthenticationMode = 'cookie', config: Partial<AuthenticationConfig> = {}) => {
	return <Schema>(client: DirectusClient<Schema>): AuthenticationClient<Schema> => {
		const authConfig = { ...defaultConfigValues, ...config };
		let refreshPromise: Promise<AuthenticationData> | null = null;
		let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
		const storage = authConfig.storage ?? memoryStorage();

		const resetStorage = async () =>
			storage.set({ access_token: null, refresh_token: null, expires: null, expires_at: null });

		const activeRefresh = async () => {
			try {
				await refreshPromise;
			} finally {
				refreshPromise = null;
			}
		};

		const refreshIfExpired = async () => {
			const authData = await storage.get();

			if (refreshPromise || !authData?.expires_at) {
				return activeRefresh();
			}

			if (authData.expires_at < new Date().getTime() + authConfig.msRefreshBeforeExpires) {
				refresh().catch((_err) => {
					/* throw err; */
				});
			}

			return activeRefresh();
		};

		const setCredentials = async (data: AuthenticationData) => {
			const expires = data.expires ?? 0;
			data.expires_at = new Date().getTime() + expires;
			await storage.set(data);

			if (authConfig.autoRefresh && expires > authConfig.msRefreshBeforeExpires && expires < MAX_INT32) {
				if (refreshTimeout) clearTimeout(refreshTimeout);

				refreshTimeout = setTimeout(() => {
					refreshTimeout = null;

					refresh().catch((_err) => {
						/* throw err; */
					});
				}, expires - authConfig.msRefreshBeforeExpires);
			}
		};

		const refresh = async () => {
			const awaitRefresh = async () => {
				const authData = await storage.get();
				await resetStorage();

				const fetchOptions: RequestInit = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				};

				if ('credentials' in authConfig) {
					fetchOptions.credentials = authConfig.credentials;
				}

				const body: Record<string, string> = { mode };

				if (mode === 'json' && authData?.refresh_token) {
					body['refresh_token'] = authData.refresh_token;
				}

				fetchOptions.body = JSON.stringify(body);

				const requestUrl = getRequestUrl(client.url, '/auth/refresh');

				return request<AuthenticationData>(requestUrl.toString(), fetchOptions, client.globals.fetch).then((data) =>
					setCredentials(data).then(() => data),
				);
			};

			refreshPromise = awaitRefresh();

			return refreshPromise;
		};

		return {
			refresh,
			async login(email: string, password: string, options: LoginOptions = {}) {
				await resetStorage();

				const authData: Record<string, string> = { email, password };
				if ('otp' in options) authData['otp'] = options.otp;
				authData['mode'] = options.mode ?? mode;

				const path = getAuthEndpoint(options.provider);
				const requestUrl = getRequestUrl(client.url, path);

				const fetchOptions: RequestInit = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(authData),
				};

				if ('credentials' in authConfig) {
					fetchOptions.credentials = authConfig.credentials;
				}

				const data = await request<AuthenticationData>(requestUrl.toString(), fetchOptions, client.globals.fetch);

				await setCredentials(data);
				return data;
			},
			async logout() {
				const authData = await storage.get();

				const fetchOptions: RequestInit = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				};

				if ('credentials' in authConfig) {
					fetchOptions.credentials = authConfig.credentials;
				}

				const body: Record<string, string> = { mode };

				if (mode === 'json' && authData?.refresh_token) {
					body['refresh_token'] = authData.refresh_token;
				}

				fetchOptions.body = JSON.stringify(body);

				const requestUrl = getRequestUrl(client.url, '/auth/logout');
				await request(requestUrl.toString(), fetchOptions, client.globals.fetch);

				this.stopRefreshing();
				await resetStorage();
			},
			stopRefreshing() {
				if (refreshTimeout) {
					clearTimeout(refreshTimeout);
				}
			},
			async getToken() {
				await refreshIfExpired().catch(() => {
					/* fail gracefully */
				});

				const data = await storage.get();
				return data?.access_token ?? null;
			},
			async setToken(access_token: string | null) {
				return storage.set({
					access_token,
					refresh_token: null,
					expires: null,
					expires_at: null,
				});
			},
		};
	};
};
