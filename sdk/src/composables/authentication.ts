import type { DirectusClient } from '../client.js';
import { withoutTrailingSlash } from '../utils.js';

type wsMode = 'public' | 'handshake' | 'strict';

interface AuthConfig {
	websocketMode?: wsMode;
	subscriptionMode?: wsMode;
}

interface AuthClientConfig {
	wsMode: wsMode;
	gqlMode: wsMode;
	apiURL: string;
}

interface AuthClient {
	config: AuthClientConfig;
	auth: AuthStorage;
	login(email: string, password: string, otp?: string): Promise<void>;
	refresh(token?: string): Promise<void>;
	logout(): Promise<void>;
}

export interface AuthStorage {
	access_token?: string;
	refresh_token?: string;
	expires_at?: number;
}

interface AuthEndpointResult {
	data: {
		access_token: string;
		refresh_token: string;
		expires: number;
	};
}

export function Authentication(cfg: AuthConfig = {}) {
	return <Client extends DirectusClient>(client: Client): AuthClient => {
		const authClient: AuthClient = {
			config: {
				wsMode: cfg.websocketMode ?? 'handshake',
				gqlMode: cfg.subscriptionMode ?? 'handshake',
				apiURL: client.config['apiURL']!,
			},
			auth: {},
			async login(email: string, password: string, otp?: string) {
				const url = this.config.apiURL + '/auth/login';

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				const payload = JSON.stringify({ email, password, ...(otp ? { otp } : {}) });

				const response = await client.config.fetch(url, {
					body: payload,
					method: 'POST',
					headers,
				});

				const data = (await response.json()) as AuthEndpointResult;
				const { access_token, refresh_token, expires } = data.data;
				this.auth.access_token = access_token;
				this.auth.refresh_token = refresh_token;

				// do this smarter later
				setTimeout(() => {
					this.refresh();
				}, expires);
			},
			async refresh(token?: string) {
				if (!this.auth.refresh_token && !token) return;

				const url = this.config.apiURL + '/auth/refresh';
				const rtoken = token ?? this.auth.refresh_token;

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				const response = await client.config.fetch(url, {
					body: JSON.stringify({ refresh_token: rtoken }),
					method: 'POST',
					headers,
				});

				const data = (await response.json()) as AuthEndpointResult;
				const { access_token, refresh_token, expires } = data.data;
				this.auth.access_token = access_token;
				this.auth.refresh_token = refresh_token;

				// do this smarter later
				setTimeout(() => {
					this.refresh();
				}, expires);
			},
			async logout() {
				if (!this.auth.refresh_token) return;

				const url = this.config.apiURL + '/auth/logout';
				const { refresh_token } = this.auth;

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				const response = await client.config.fetch(url, {
					body: JSON.stringify({ refresh_token }),
					method: 'POST',
					headers,
				});

				const data = await response.json();
				return data.data;
			},
		};

		return authClient;
	};
}
