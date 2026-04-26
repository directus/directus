// using "| any" to ensure compatibility with various "Fetch" alternative function signatures
export type FetchInterface = (input: string | any, init?: RequestInit | any) => Promise<unknown>;

/**
 * Declared locally so that SDK consumers do not need `"lib": ["DOM"]` in their tsconfig.
 * Matches the standard Fetch API definition.
 * @see https://fetch.spec.whatwg.org/#requestcredentials
 */
export type RequestCredentials = 'include' | 'omit' | 'same-origin';

/**
 * Minimal CloseEvent interface for WebSocket close callbacks.
 * Declared locally to avoid a hard dependency on DOM lib types.
 */
export interface CloseEvent {
	readonly code: number;
	readonly reason: string;
	readonly wasClean: boolean;
	readonly type: string;
	readonly target: any;
}

export type UrlInterface = typeof URL;

/** While the standard says 'string | URL' for the 'url' parameter, some implementations (e.g. React Native) only accept 'string' */
export type WebSocketConstructor = {
	new (url: string, protocols?: string | string[]): WebSocketInterface;
};

export type WebSocketInterface = {
	readonly readyState: number;

	addEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any): void;
	removeEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any): void;

	send(data: string): void;
	close(code?: number, reason?: string): void;
};

export type LogLevels = 'log' | 'info' | 'warn' | 'error';

export type ConsoleInterface = {
	[level in LogLevels]: (...args: any) => any;
};
