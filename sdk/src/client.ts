import type { ClientGlobals, ClientOptions, DirectusClient } from './types/client.js';

/**
 * The default globals supplied to the client
 */
const defaultGlobals: ClientGlobals = {
	fetch: globalThis.fetch,
	WebSocket: globalThis.WebSocket,
	URL: globalThis.URL,
	logger: globalThis.console,
};

/**
 * Creates a client to communicate with a Directus app.
 *
 * @param {string} url - The URL to the Directus app.
 * @param {ClientOptions} [options] - The client options. Defaults to defaultGlobals.
 *     {@see {@link ClientOptions}} and {@see {@link ClientGlobals}}
 *
 * @returns {DirectusClient} A Directus client.
 */
export const createDirectus = <Schema = any>(url: string, options: ClientOptions = {}): DirectusClient<Schema> => {
	const globals = options.globals ? { ...defaultGlobals, ...options.globals } : defaultGlobals;
	return {
		globals,
		url: new globals.URL(url),
		with(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
