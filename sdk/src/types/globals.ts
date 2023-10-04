/// <reference lib="dom" />

export type FetchInterface =
	| ((input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>)
	| ((input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>);

export type UrlInterface = typeof URL;

export type WebSocketConstructor = {
	new (url: URL, protocols?: string | string[]): WebSocketInterface;
};

export interface WebSocketInterface {
	readonly readyState: number;

	addEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any): void;
	removeEventListener(type: string, listener: (this: WebSocketInterface, ev: any) => any): void;

	send(data: string): void;
	close(code?: number, reason?: string): void;
}
