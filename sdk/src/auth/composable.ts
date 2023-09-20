import type { LoginOptions } from '../index.js';
import type { DirectusClient } from '../types/client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { AuthenticationClient, AuthenticationConfig, AuthenticationData, AuthenticationMode } from './types.js';
import { memoryStorage } from './utils/memory-storage.js';

const defaultConfigValues: AuthenticationConfig = {
	msRefreshBeforeExpires: 30000, // 30 seconds
	autoRefresh: true,
	credentials: 'same-origin',
};

/**
 * Creates a client to authenticate with Directus.
 *
 * @param mode AuthenticationMode
 * @param config The optional configuration.
 *
 * @returns A Directus authentication client.
 */
export const authentication = (mode: AuthenticationMode = 'cookie', config: Partial<AuthenticationConfig> = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): AuthenticationClient<Schema> => {
		const authConfig = { ...defaultConfigValues, ...config };
		let refreshPromise: Promise<AuthenticationData> | null = null;
		let refreshTimeout: NodeJS.Timer | null = null;
		const storage = authConfig.storage ?? memoryStorage();

		const resetStorage = () => {
			storage.set({ access_token: null, refresh_token: null, expires: null, expires_at: null });
		};

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
				await activeRefresh();
				return;
			}

			if (authData.expires_at < new Date().getTime() + authConfig.msRefreshBeforeExpires) {
				refresh().catch((_err) => {
					/* throw err; */
				});
			}

			await activeRefresh();
		};

		const setCredentials = (data: AuthenticationData) => {
			const expires = data.expires ?? 0;
			data.expires_at = new Date().getTime() + expires;
			storage.set(data);

			if (authConfig.autoRefresh && expires > authConfig.msRefreshBeforeExpires && expires < Number.MAX_SAFE_INTEGER) {
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
				resetStorage();

				const options = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: authConfig.credentials,
				} as RequestInit;

				if (mode === 'json' && authData?.refresh_token) {
					options.body = JSON.stringify({
						refresh_token: authData.refresh_token,
					});
				}

				const requestUrl = getRequestUrl(client.url, '/auth/refresh');

				const data = await request<AuthenticationData>(requestUrl.toString(), options, client.globals.fetch);

				setCredentials(data);
				return data;
			};

			refreshPromise = awaitRefresh().catch((err) => {
				throw err;
			});

			return refreshPromise;
		};

		return {
			refresh,
			async login(email: string, password: string, options: LoginOptions = {}) {
				// TODO: allow for websocket only authentication
				resetStorage();

				const requestUrl = getRequestUrl(client.url, '/auth/login');

				const authData: Record<string, string> = { email, password };
				if ('otp' in options) authData['otp'] = options.otp;
				if ('mode' in options) authData['mode'] = options.mode;

				const data = await request<AuthenticationData>(
					requestUrl.toString(),
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(authData),
						credentials: authConfig.credentials,
					},
					client.globals.fetch
				);

				setCredentials(data);
				return data;
			},
			async logout() {
				const authData = await storage.get();

				const options: RequestInit = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: authConfig.credentials,
				};

				if (mode === 'json' && authData?.refresh_token) {
					options.body = JSON.stringify({
						refresh_token: authData.refresh_token,
					});
				}

				const requestUrl = getRequestUrl(client.url, '/auth/logout');
				await request(requestUrl.toString(), options, client.globals.fetch);

				if (refreshTimeout) clearTimeout(refreshTimeout);
				resetStorage();
			},
			async getToken() {
				await refreshIfExpired();

				const data = await storage.get();
				return data?.access_token ?? null;
			},
			setToken(access_token: string | null) {
				storage.set({
					access_token,
					refresh_token: null,
					expires: null,
					expires_at: null,
				});
			},
		};
	};
};
