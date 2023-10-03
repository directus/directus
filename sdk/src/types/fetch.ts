/// <reference lib="dom" />

export type FetchInterface =
	| ((input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>)
	| ((input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>);

export type UrlInterface = typeof URL;
export type WebSocketInterface = typeof WebSocket;
