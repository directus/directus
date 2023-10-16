export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
	path: string;
	method?: HttpMethod;
	params?: Record<string, any>;
	headers?: Record<string, string>;
	body?: string | FormData;
	onRequest?: RequestTransformer;
	onResponse?: ResponseTransformer;
}

export type RequestTransformer = (options: RequestInit) => RequestInit | Promise<RequestInit>;

export type ResponseTransformer<Output = any> = (data: any, request: RequestInit) => Output | Promise<Output>;
