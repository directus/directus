import type { AuthenticationData, AuthenticationStorage } from '../types.js';

/**
 * Simple memory storage implementation
 *
 * @returns AuthenticationStorage
 */
export const memoryStorage = () => {
	let store: AuthenticationData | null = null;

	return {
		get: async () => store,
		set: async (value: AuthenticationData | null) => {
			store = value;
		},
	} as AuthenticationStorage;
};
