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

	constructor(axios: AxiosInstance, options: AuthOptions) {
		this.axios = axios;
		this.storage = options.storage;
		this.mode = options.mode;
		this.autoRefresh = options.autoRefresh;

		if (this.autoRefresh) {
			this.refresh();
		}
	}

	get token(): string | null {
		return this.axios.defaults.headers?.Authorization?.split(' ')[1] || null;
	}

	set token(val: string | null) {
		this.axios.defaults.headers = {
			...(this.axios.defaults.headers || {}),
			Authorization: val ? `Bearer ${val}` : undefined,
		};
	}

	async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
		const response = await this.axios.post<{ data: AuthResponse }>('/auth/login', {
			...credentials,
			mode: this.mode,
		});

		this.token = response.data.data.access_token;

		if (this.mode === 'json') {
			await this.storage.setItem('directus_refresh_token', response.data.data.refresh_token);
		}

		if (this.autoRefresh) {
			setTimeout(() => this.refresh(), response.data.data.expires - 10000);
		}

		return response.data;
	}

	async refresh(): Promise<{ data: AuthResponse }> {
		const payload: Record<string, any> = { mode: this.mode };

		if (this.mode === 'json') {
			const refreshToken = await this.storage.getItem('directus_refresh_token');
			payload['refresh_token'] = refreshToken;
		}

		const response = await this.axios.post<{ data: AuthResponse }>('/auth/refresh', payload);

		this.token = response.data.data.access_token;

		if (this.mode === 'json') {
			await this.storage.setItem('directus_refresh_token', response.data.data.refresh_token);
		}

		if (this.autoRefresh) {
			setTimeout(() => this.refresh(), response.data.data.expires - 10000);
		}

		return response.data;
	}

	async logout(): Promise<void> {
		await this.axios.post('/auth/logout');
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
}
