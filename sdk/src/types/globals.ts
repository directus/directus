// using "| any" to ensure compatibility with various "Fetch" alternative function signatures
export type FetchInterface = (input: string | any, init?: RequestInit | any) => Promise<unknown>;

/**
 * Structural equivalent of the DOM `RequestCredentials` type, redeclared here so the SDK's public
 * type definitions don't require the `DOM` lib to be present in consuming projects (e.g. Node ESM).
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include';

/**
 * Minimal structural equivalent of the DOM `CloseEvent`, redeclared here so the SDK's public type
 * definitions don't require the `DOM` lib to be present in consuming projects (e.g. Node ESM).
 */
export type CloseEventInterface = {
	readonly type: string;
	readonly code: number;
	readonly reason: string;
	readonly wasClean: boolean;
};

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
