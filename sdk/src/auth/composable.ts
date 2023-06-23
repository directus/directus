import type { DirectusClient } from '../client.js';
import { request } from '../utils/request.js';
import type {
	AuthenticationClient,
	AuthenticationConfigJson,
	AuthenticationCredentials,
	AuthTokenMode,
} from './types.js';

interface AuthComposable {
	<Schema extends object>(client: DirectusClient<Schema>): Promise<AuthenticationClient<Schema>>;
}

export function auth(): AuthComposable;
export function auth(mode: 'cookie'): AuthComposable;
export function auth(mode: 'json', config: AuthenticationConfigJson): AuthComposable;
export function auth(modeOrNever?: AuthTokenMode, config?: AuthenticationConfigJson) {
	const mode = modeOrNever ?? 'cookie';

	return async <Schema extends object>(client: DirectusClient<Schema>): Promise<AuthenticationClient<Schema>> => {
		return {
			async login(credentials: AuthenticationCredentials) {
				const res = await request(client.url, {
					method: 'POST',
					body: JSON.stringify(credentials),
					path: '/auth/login',
				});
			},
			async refresh() {
				// TODO implement
			},
			async logout() {
				// TODO implement
			},
		};
	};
}
