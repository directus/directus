import type { DirectusClient } from './types/client.js';

/**
 * Creates a client to communicate with a Directus app.
 *
 * @param url The URL to the Directus app.
 * @param config The optional configuration.
 *
 * @returns A Directus client.
 */
export const useDirectus = <Schema extends object = any>(url: string): DirectusClient<Schema> => {
	return {
		url: new URL(url),
		use(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
