// using "| any" to ensure compatibility with various "Fetch" alternative function signatures
export type FetchInterface = (input: string | any, init?: RequestInit | any) => Promise<unknown>;

export type UrlInterface = typeof URL;

/** While the standard envisages 'string | URL', some implementations (e.g. React Native) only accept 'string' */
type WebSocketUrl = string;

export type WebSocketConstructor = {
	new (url: WebSocketUrl, protocols?: string | string[]): WebSocketInterface;
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
