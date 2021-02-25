import { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { AuthStorage } from '../types';

export type LoginCredentials = {
	email: string;
	password: string;
	otp?: string;
};

export type AuthOptions = {
	mode: 'cookie' | 'json';
	autoRefresh: boolean;
	storage: AuthStorage;
};

export type AuthResponse = {
	access_token: string;
	expires: number;
	refresh_token?: string;
};

export class AuthHandler {
	private axios: AxiosInstance;
	private storage: AuthStorage;
	private mode: 'cookie' | 'json';
	private autoRefresh: boolean;
	private autoRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
	private expiresAt?: number;
	/**
	 * Used for tracking if accessToken is restored from store to config.
	 * Axios uses this number for interceptor. If it's number it means it's inited.
	 */
	private accessTokenInitId: number | null = null;

	constructor(axios: AxiosInstance, options: AuthOptions) {
		this.axios = axios;
		this.storage = options.storage;
		this.mode = options.mode;
		this.autoRefresh = options.autoRefresh;

		this.accessTokenInitId = this.axios.interceptors.request.use((config) => this.initializeAccessToken(config));

		if (this.autoRefresh) {
			this.refresh(true);
		}
	}

	get token(): string | null {
		return this.axios.defaults.headers?.Authorization?.split(' ')[1] || null;
	}

	set token(val: string | null) {
		if (val === null) {
			delete this.axios.defaults.headers?.Authorization;
		} else {
			this.axios.defaults.headers = {
				...(this.axios.defaults.headers || {}),
				Authorization: `Bearer ${val}`,
			};
		}
	}

	async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
		this.removeTimeout();
		const response = await this.axios.post('/auth/login', { ...credentials, mode: this.mode });

		const data = response.data.data;
		this.token = data.access_token;
		this.expiresAt = Date.now() + data.expires;

		await this.storage.setItem('directus_access_token', this.token);
		await this.storage.setItem('directus_access_token_expires', this.expiresAt);

		if (this.mode === 'json') {
			await this.storage.setItem('directus_refresh_token', data.refresh_token);
		}
		if (this.autoRefresh) {
			this.refresh(true);
		}

		return response.data;
	}

	/**
	 * Refresh access token 10 seconds before expiration
	 */
	async refresh(isInitialInvoke: Boolean): Promise<{ data: AuthResponse } | undefined> {
		this.removeTimeout();

		this.expiresAt = await this.storage.getItem('directus_access_token_expires');
		if (!this.expiresAt) return;

		if (Date.now() + 10000 < this.expiresAt && this.autoRefresh) {
			this.autoRefreshTimeout = setTimeout(() => this.refresh(false), this.expiresAt - Date.now() - 10000);
			if (!isInitialInvoke) {
				return;
			}
		}

		const payload: Record<string, any> = { mode: this.mode };

		if (this.mode === 'json') {
			const refreshToken = await this.storage.getItem('directus_refresh_token');
			payload['refresh_token'] = refreshToken;
		}

		if (this.expiresAt < Date.now() + 1000) {
			this.token = null;
		}
		const response = await this.axios
			.post<{ data: AuthResponse }>('/auth/refresh', payload)
			.catch(async (error: AxiosError) => {
				const status = error.response?.status;
				if (status === 401) {
					await this.storage.removeItem('directus_access_token');
					await this.storage.removeItem('directus_access_token_expires');
					if (this.mode === 'json') {
						await this.storage.removeItem('directus_refresh_token');
					}
					this.token = null;
				}
				throw Promise.reject(error);
			});

		const data = response.data.data;
		this.token = data.access_token;
		this.expiresAt = Date.now() + data.expires;
		await this.storage.setItem('directus_access_token', this.token);
		await this.storage.setItem('directus_access_token_expires', this.expiresAt);

		if (this.mode === 'json') {
			await this.storage.setItem('directus_refresh_token', response.data.data.refresh_token);
		}

		if (this.autoRefresh) {
			this.autoRefreshTimeout = setTimeout(() => this.refresh(false), data.expires - 10000);
		}
		return response.data;
	}

	async logout(): Promise<void> {
		this.removeTimeout();
		const data: Record<string, string> = {};
		if (this.mode === 'json') {
			data.refresh_token = await this.storage.getItem('directus_refresh_token');
		}
		await this.axios.post('/auth/logout', data);

		await this.storage.removeItem('directus_access_token');
		await this.storage.removeItem('directus_access_token_expires');
		if (this.mode === 'json') {
			await this.storage.removeItem('directus_refresh_token');
		}
		this.token = null;
	}

	password = {
		request: async (email: string): Promise<void> => {
			await this.axios.post('/auth/password/request', { email });
		},

		reset: async (token: string, password: string): Promise<void> => {
			await this.axios.post('/auth/password/reset', { token, password });
		},
	};

	/**
	 * There is no prettier way to do this. We need to set access token before first request.
	 * This way we intercept axios request and only first time request token from store,
	 * and allows us to do new Directus(url).items(col).read() without having to handle
	 * access_token restoration in methods
	 */
	private async initializeAccessToken(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
		if (this.accessTokenInitId !== null) {
			const token = await this.storage.getItem('directus_access_token');
			if (token) {
				this.token = token;
				config.headers.Authorization = `Bearer ${token}`;
			}
			this.axios.interceptors.request.eject(this.accessTokenInitId);
			this.accessTokenInitId = null;
		}

		return config;
	}

	private removeTimeout(): void {
		if (this.autoRefreshTimeout !== null) {
			clearTimeout(this.autoRefreshTimeout);
			this.autoRefreshTimeout = null;
		}
	}
}
