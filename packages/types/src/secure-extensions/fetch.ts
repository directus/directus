export type FetchSecure = (url: string, options?: RequestInitSecure) => Promise<ResponseSecure>;

export type RequestInitSecure = {
	body?: string | null;
	cache?: RequestCache;
	credentials?: RequestCredentials;
	headers?: [string, string][] | Record<string, string>;
	integrity?: string;
	keepalive?: boolean;
	method?: string;
	mode?: RequestMode;
	redirect?: RequestRedirect;
	referrer?: string;
	referrerPolicy?: ReferrerPolicy;
}

export type ResponseSecure = {
	readonly bodyUsed: boolean;
	readonly headers: Record<string, string>
	readonly ok: boolean;
	readonly redirected: boolean;
	readonly status: number;
	readonly statusText: string;
	readonly type: ResponseType;
	readonly url: string;
	json(): Promise<any>;
	text(): Promise<string>;
}
