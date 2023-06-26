import type { DirectusClient } from '../client.js';
import type { RequestOptions } from '../types/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { AuthenticationClient, AuthenticationConfig, AuthenticationData, AuthenticationMode } from './types.js';
import { memoryStorage } from './utils/memory-storage.js';

const defaultConfigValues = {
	msRefreshBeforeExpires: 30000, // 30 seconds
	autoRefresh: true,
};

export const authentication = (mode: AuthenticationMode = 'cookie', config: AuthenticationConfig = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): AuthenticationClient<Schema> => {
		config = { ...defaultConfigValues, ...config };
		let refreshPromise: Promise<unknown> | null = null;
		let refreshTimeout: NodeJS.Timer | null = null;
		const storage = config.storage ?? memoryStorage();

		const autoRefresh = 'autoRefresh' in config ? config.autoRefresh : defaultConfigValues.autoRefresh;

		const msRefreshBeforeExpires =
			typeof config.msRefreshBeforeExpires === 'number'
				? config.msRefreshBeforeExpires
				: defaultConfigValues.msRefreshBeforeExpires;

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

			if (authData.expires_at < new Date().getTime() + msRefreshBeforeExpires) {
				refresh();
			}

			await activeRefresh();
		};

		const setCredentials = (data: AuthenticationData) => {
			const expires = data.expires ?? 0;
			data.expires_at = new Date().getTime() + expires;
			storage.set(data);

			if (autoRefresh && expires > msRefreshBeforeExpires && expires < Number.MAX_SAFE_INTEGER) {
				if (refreshTimeout) clearTimeout(refreshTimeout);

				refreshTimeout = setTimeout(() => {
					refreshTimeout = null;
					refresh();
				}, expires - msRefreshBeforeExpires);
			}
		};

		const refresh = async () => {
			const awaitRefresh = async () => {
				const authData = await storage.get();
				resetStorage();

				const options = {
					path: '/auth/refresh',
					method: 'POST',
				} as RequestOptions;

				if (mode === 'json' && authData?.refresh_token) {
					options.body = JSON.stringify({
						refresh_token: authData.refresh_token,
					});
				}

				const requestUrl = getRequestUrl(client.url, options);
				const data = await request<AuthenticationData>(requestUrl.toString(), options);

				setCredentials(data);
				return data;
			};

			refreshPromise = awaitRefresh();
			return refreshPromise;
		};

		return {
			refresh,
			async login(email: string, password: string) {
				// TODO: allow for websocket only authentication
				resetStorage();

				const options = {
					path: '/auth/login',
					method: 'POST',
					body: JSON.stringify({
						email,
						password,
					}),
				} as RequestOptions;

				const requestUrl = getRequestUrl(client.url, options);
				const data = await request<AuthenticationData>(requestUrl.toString(), options);

				setCredentials(data);
				return data;
			},
			async logout() {
				const authData = await storage.get();

				const options = {
					path: '/auth/logout',
					method: 'POST',
				} as RequestOptions;

				if (mode === 'json' && authData?.refresh_token) {
					options.body = JSON.stringify({
						refresh_token: authData.refresh_token,
					});
				}

				const requestUrl = getRequestUrl(client.url, options);
				await request(requestUrl.toString(), options);

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
