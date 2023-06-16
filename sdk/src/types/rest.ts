export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RestCommand<_Input extends object, _Output extends object | unknown, _Schema extends object> {
	(): RestRequestOptions;
}

export interface RestRequestOptions {
	method: HttpMethod;
	path: string;
	params?: Record<string, string>;
	headers?: Record<string, string>;
	body?: string;
}
