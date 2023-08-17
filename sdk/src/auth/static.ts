import type { DirectusClient } from '../types/client.js';
import type { StaticTokenClient } from './types.js';

/**
 * Creates a client to authenticate with Directus using a static token.
 *
 * @param token static token.
 *
 * @returns A Directus static token client.
 */
export const staticToken = (access_token: string) => {
	return <Schema extends object>(_client: DirectusClient<Schema>): StaticTokenClient<Schema> => {
		let token: string | null = access_token ?? null;
		return {
			async getToken() {
				return token;
			},
			setToken(access_token: string | null) {
				token = access_token;
			},
		};
	};
};
