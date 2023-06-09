import type { DirectusClient } from '../client.js';

type wsMode = 'public' | 'handshake' | 'strict';

interface AuthConfig {
	websocketMode?: wsMode;
	subscriptionMode?: wsMode;
}

interface AuthClientConfig {
	wsMode: wsMode;
	gqlMode: wsMode;
}

interface AuthClient {
	config: AuthClientConfig;
	login(): void;
	logout(): void;
	refresh(): void;
}

interface AuthStorage {
	access_token?: string;
	refresh_token?: string;
}

export function Authentication(cfg: AuthConfig = {}) {
	return <Client extends DirectusClient>(_client: Client): AuthClient => {
		const authClient: AuthClient = {
			config: {
				wsMode: cfg.websocketMode ?? 'handshake',
				gqlMode: cfg.subscriptionMode ?? 'handshake',
			},
			login() {
				// x
			},
			logout() {
				// y
			},
			refresh() {
				// z
			},
		};

		return authClient;
	};
}
