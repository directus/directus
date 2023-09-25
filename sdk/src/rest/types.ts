import type { RequestOptions, RequestTransformer, ResponseTransformer } from '../types/request.js';

export interface RestCommand<_Output extends object | unknown, _Schema extends object> {
	(): RequestOptions;
}

export interface RestClient<Schema extends object> {
	request<Output>(options: RestCommand<Output, Schema>): Promise<Output>;
}

export interface RestConfig {
	credentials?: RequestCredentials;
	// onError?: (error: any) => any;
	onRequest?: RequestTransformer;
	onResponse?: ResponseTransformer;
}
