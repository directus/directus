export type Method =
	| 'get'
	| 'GET'
	| 'delete'
	| 'DELETE'
	| 'head'
	| 'HEAD'
	| 'options'
	| 'OPTIONS'
	| 'post'
	| 'POST'
	| 'put'
	| 'PUT'
	| 'patch'
	| 'PATCH'
	| 'purge'
	| 'PURGE'
	| 'link'
	| 'LINK'
	| 'unlink'
	| 'UNLINK';

export interface RequestOptions {
	proxy?: false | any;
	timeout?: number;
	maxRedirects?: number;
}

export interface RequestConfig {
	url: string;
	method: Method;
	data?: any;
	headers?: Record<string, any>;
	options?: RequestOptions;
}
