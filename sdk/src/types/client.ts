/**
 * empty directus client
 */
export interface DirectusClient<Schema extends object> {
	url: URL;
	globals: ClientGlobals;
	with: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

export interface ClientGlobals {
	fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
	WebSocket: typeof globalThis.WebSocket,
	URL: typeof globalThis.URL,
}
