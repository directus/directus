// using "| any" to ensure compatibility with various "Fetch" alternative function signatures
export type FetchInterface = (input: string | any, init?: RequestInit | any) => Promise<unknown>;

export type UrlInterface = typeof URL;

/**
 * The same union the DOM lib declares. Naming the global instead leaves it unresolved in the
 * published types for anyone building without the DOM lib (TS2304).
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include';

/**
 * The DOM's `MessageEvent` is generic and the Node global is not, so the published types can
 * name neither. Only `data` is read; the index signature keeps the rest of whatever a real
 * implementation carries reachable.
 */
export type MessageEventInterface<T = string> = {
	readonly data: T;
	[key: string]: any;
};

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
