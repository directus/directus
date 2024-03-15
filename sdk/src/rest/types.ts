import type { RequestHooks } from '../types/hooks.js';
import type { RequestOptions } from '../types/request.js';

export interface RestCommand<_Output extends object | unknown, _Schema extends object> {
	(): RequestOptions;
}

export interface RestClient<Schema extends object> {
	request<Output>(options: RestCommand<Output, Schema>): Promise<Output>;
}

export type RestConfig = Partial<RequestHooks> & {
	credentials?: RequestCredentials;
};
