export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
	method: HttpMethod;
	path: string;
	params?: Record<string, string>;
	headers?: Record<string, string>;
	body?: string;
}
