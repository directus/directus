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

export interface RESTClient {
	config: RESTClientConfig;
	request<Schema extends object, Options extends object, Output extends object>(
		options: RESTCommand<Schema, Options, Output>
	): any;
}

export function REST(cfg: RESTConfig) {
	return <Client extends DirectusClient>(_client: Client): RESTClient => {
		const restClient: RESTClient = {
			config: {
				apiURL: withoutTrailingSlash(cfg.url),
			},
			async request<Options extends object, Output extends object>(
				options: RESTCommand<Schema, Options, Output>
			): Promise<Output> {
				const url = this.config.apiURL + options.path;
				const headers: Record<string, string> = options.headers ?? {};

				if ('auth' in this) {
					const { access_token } = this.auth as Record<string, string>;

					if (access_token) {
						headers['Authorization'] = `Bearer ${access_token}`;
					}
				}

				const response = await _client.config.fetch(url, {
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
