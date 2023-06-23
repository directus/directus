import type { DirectusClient } from '../client.js';
import type { AuthenticationClient, AuthenticationConfig } from './types.js';

export const auth = (_config: AuthenticationConfig = { mode: 'cookie' }) => {
	return <Schema extends object>(_client: DirectusClient<Schema>): AuthenticationClient<Schema> => {
		return {
			async login(_creds: { email: string; password: string }) {
				// TODO implement
			},
			async refresh() {
				// TODO implement
			},
			async logout() {
				// TODO implement
			},
		};
	};
};
