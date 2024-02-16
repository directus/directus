import type { ConsoleInterface, FetchInterface, WebSocketConstructor } from './globals.js';
import type { RequestHooks, RequestHooksList } from './hooks.js';

/**
 * empty directus client
 */
export interface DirectusClient<Schema extends object> {
	url: URL;
	globals: ClientGlobals;
	hooks: RequestHooksList;
	with: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}

/**
 * All used globals for the client
 */
export type ClientGlobals = {
	fetch: FetchInterface;
	WebSocket: WebSocketConstructor;
	logger: ConsoleInterface;
	URL: typeof URL;
};


/**
 * Available options on the client
 */
export type ClientOptions = {
	globals?: Partial<ClientGlobals>;
	hooks?: Partial<RequestHooks>;
};
