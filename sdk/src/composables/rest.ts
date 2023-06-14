import type { DirectusClient } from '../client.js';
import type { RESTCommand } from '../index.js';
import { serializeParams, withoutTrailingSlash } from '../utils.js';
import type { AuthStorage } from './authentication.js';

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
				const queryString = serializeParams(options.params ?? {});
				const url = this.config.apiURL + options.path + (queryString ? '?' + queryString : '');

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
					...(options.headers ?? {}),
				};

				if ('auth' in this) {
					const { access_token } = this.auth as AuthStorage;

					if (access_token) {
						headers['Authorization'] = `Bearer ${access_token}`;
					}
				}

				const response = await client.config.fetch(url, {
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
