import type { DirectusClient } from '../client.js';
import type { RequestOptions } from '../types/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { AuthenticationClient, AuthenticationConfig, AuthenticationData } from './types.js';
import { memoryStorage } from './utils/memory-storage.js';

export const auth = (config: AuthenticationConfig = { mode: 'cookie' }) => {
	return <Schema extends object>(client: DirectusClient<Schema>): AuthenticationClient<Schema> => {
		let refreshPromise: Promise<any> | null = null;
		const storage = config.storage ?? memoryStorage();

		const resetStorage = () => {
			storage.set({ access_token: null, refresh_token: null, expires: null });
		};

		return {
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

				storage.set(data);
				return data;
			},
			async refresh() {
				const awaitRefresh = async () => {
					const authData = await storage.get();
					resetStorage();

					const options = {
						path: '/auth/refresh',
						method: 'POST',
					} as RequestOptions;

					if (config.mode === 'json' && authData?.refresh_token) {
						options.body = JSON.stringify({
							refresh_token: authData.refresh_token,
						});
					}

					const requestUrl = getRequestUrl(client.url, options);
					const data = await request<AuthenticationData>(requestUrl.toString(), options);

					storage.set(data);
					return data;
				};

				refreshPromise = awaitRefresh();
				return refreshPromise;
			},
			async logout() {
				const authData = await storage.get();

				const options = {
					path: '/auth/logout',
					method: 'POST',
				} as RequestOptions;

				if (config.mode === 'json' && authData?.refresh_token) {
					options.body = JSON.stringify({
						refresh_token: authData.refresh_token,
					});
				}

				const requestUrl = getRequestUrl(client.url, options);
				await request(requestUrl.toString(), options);

				resetStorage();
			},
			async getToken() {
				if (refreshPromise !== null) {
					try {
						await refreshPromise;
					} finally {
						refreshPromise = null;
					}
				}

				const data = await storage.get();
				return data?.access_token ?? null;
			},
			setToken(access_token: string | null) {
				storage.set({
					access_token,
					refresh_token: null,
					expires: null,
				});
			},
		};
	};
};
