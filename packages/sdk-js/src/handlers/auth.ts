import { AxiosInstance } from 'axios';
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

export class AuthHandler {
	axios: AxiosInstance;
	storage: AuthStorage;
	mode: 'cookie' | 'json';
	autoRefresh: boolean;

	constructor(axios: AxiosInstance, options: AuthOptions) {
		this.axios = axios;
		this.storage = options.storage;
		this.mode = options.mode;
		this.autoRefresh = options.autoRefresh;
	}

	get token() {
		return this.axios.defaults.headers?.Authorization?.split(' ')[1] || null;
	}

	set token(val: string | null) {
		this.axios.defaults.headers = {
			...(this.axios.defaults.headers || {}),
			Authorization: `Bearer ${val}`,
		};
	}

	async login(credentials: LoginCredentials) {
		const response = await this.axios.post('/auth/login', { ...credentials, mode: this.mode });

		this.token = response.data.data.access_token;

		await this.storage.set('directus_refresh_token', response.data.data.refresh_token);

		if (this.autoRefresh) {
			setTimeout(() => this.refresh(), response.data.data.expires - 10000);
		}

		return response.data;
	}

	async refresh() {
		const refreshToken = await this.storage.get('directus_refresh_token');
		const response = await this.axios.post('/auth/refresh', {
			refresh_token: refreshToken,
			mode: this.mode,
		});

		this.token = response.data.data.access_token;

		await this.storage.set('directus_refresh_token', response.data.data.refresh_token);

		if (this.autoRefresh) {
			setTimeout(() => this.refresh(), response.data.data.expires - 10000);
		}

		return response.data;
	}

	async logout() {
		await this.axios.post('/auth/logout');
		this.token = null;
	}

	password = {
		request: async (email: string) => {
			await this.axios.post('/auth/password/request', { email });
		},

		reset: async (token: string, password: string) => {
			await this.axios.post('/auth/password/reset', { token, password });
		},
	};
}
