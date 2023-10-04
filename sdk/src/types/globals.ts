// had to take the "| any" way out because supporting each and every "fetch" alternative type
// is not feasable because all have different custom properties we cannot account for and the
// "unknown" return type is checked at runtime by the extractData function
export type FetchInterface = (input: string | any, init?: RequestInit | any) => Promise<unknown>;

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
