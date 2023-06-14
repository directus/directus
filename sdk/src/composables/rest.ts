import type { DirectusClient } from '../client.js';
import type { RESTCommand } from '../index.js';
import { withoutTrailingSlash } from '../utils.js';

export interface RESTConfig {
	url: string;
}

export interface RESTClientConfig {
	apiURL: string;
}

export type HTTPMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RESTRequestOptions {
	path: string;
	params?: Record<string, any>;
	method?: HTTPMethod;
	headers?: Record<string, string>;
	body?: string;
}

export interface RESTClient<Schema extends object> {
	config: RESTClientConfig;
	request<Options extends object, Output extends object>(
		options: RESTCommand<Options, Output, Schema>
	): Promise<Output>;
}

export function REST(cfg: RESTConfig) {
	return <Schema extends object, Features extends object>(
		client: DirectusClient<Schema, Features>
	): RESTClient<Schema> => {
		const restClient = {
			config: {
				apiURL: withoutTrailingSlash(cfg.url),
			},
			async request<Options extends object, Output extends object>(
				optionsCallback: RESTCommand<Options, Output, Schema>
			): Promise<Output> {
				const options = optionsCallback();
				const url = this.config.apiURL + options.path;
				const headers: Record<string, string> = options.headers ?? {};

				if ('auth' in this) {
					const { access_token } = this.auth as Record<string, string>;

					if (access_token) {
						headers['Authorization'] = `Bearer ${access_token}`;
					}
				}

				const response = await client.config.fetch(url, {
					url,
					headers,
					method: options.method ?? 'GET',
				});

				if (!response.ok) {
					throw new Error('Request errored');
				}

				const data = await response.json();

				return data.data;
			},
		};

		return restClient;
	};
}
