import type { DirectusClient } from '../client.js';
import { withoutTrailingSlash } from '../utils.js';

export interface RESTConfig {
	url: string;
}

export interface RESTClientConfig {
	apiURL: string;
}

export interface RESTClient {
	config: RESTClientConfig;
	request(path: string, options: any): any;
}

export function REST(cfg: RESTConfig) {
	return <Client extends DirectusClient>(_client: Client): RESTClient => {
		const restClient: RESTClient = {
			config: {
				apiURL: withoutTrailingSlash(cfg.url),
			},
			async request(path: string, options: any) {
				const response = await _client.config.fetch(this.config.apiURL + path, options);
				return await response.json();
			},
		};

		return restClient;
	};
}
