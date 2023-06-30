export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
	method: HttpMethod;
	path: string;
	params?: Record<string, string>;
	headers?: Record<string, string>;
	body?: string;
	transformRequest?: RequestTransformer;
	transformResponse?: ResponseTransformer;
}

export interface RequestTransformer {
	(options: RequestOptions): RequestInit | Promise<RequestInit>;
}

export interface ResponseTransformer {
	<Output = any>(response: Response): Output | Promise<Output>;
}
