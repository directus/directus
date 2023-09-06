/**
 * empty directus client
 */
export interface DirectusClient<Schema extends object> {
	url: URL;
	globals: ClientGlobals;
	with: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

/**
 * All used globals for the client
 */
export interface ClientGlobals {
	fetch: typeof globalThis.fetch;
	WebSocket: typeof globalThis.WebSocket;
	URL: typeof globalThis.URL;
}

/**
 * Available options on the client
 */
export interface ClientOptions {
	globals?: Partial<ClientGlobals>;
}
