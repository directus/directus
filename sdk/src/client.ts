import type { RequestHooksList } from './types/hooks.js';
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
 * @param url The URL to the Directus app.
 * @param config The optional configuration.
 *
 * @returns A Directus client.
 */
export const createDirectus = <Schema extends object = any>(
	url: string,
	options: ClientOptions = {},
): DirectusClient<Schema> => {
	const globals = options.globals ? { ...defaultGlobals, ...options.globals } : defaultGlobals;
	const hooks: RequestHooksList = { onRequest: [], onResponse: [], onError: [] };

	if (options.hooks?.onRequest) hooks.onRequest.push(options.hooks.onRequest);
	if (options.hooks?.onResponse) hooks.onResponse.push(options.hooks.onResponse);
	if (options.hooks?.onError) hooks.onError.push(options.hooks.onError);

	return {
		globals,
		hooks,
		url: new globals.URL(url),
		with(createExtension) {
			return {
				...this,
				...createExtension(this),
			};
		},
	};
};
