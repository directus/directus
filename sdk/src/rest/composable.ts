import type { DirectusClient } from '../client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import type { RestClient, RestCommand, RestConfig } from './types.js';
import { extractJsonData } from './utils/extract-json-data.js';

/**
 * Creates a client to communicate with the Directus REST API.
 *
 * @returns A Directus REST client.
 */
export const rest = (config: RestConfig = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Output = any>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();
				const onError = config.onError ?? ((_err: any) => undefined);

				if (!options.headers?.['Content-Type']) {
					if (!options.headers) options.headers = {};
					options.headers['Content-Type'] = 'application/json';
				}

				if (!options.processResponse) {
					options.processResponse = extractJsonData;
				}

				// we need to use THIS here instead of client allow for overridden functions
				const self = this as RestClient<Schema> & DirectusClient<Schema>;
				const token = await self.getToken();

				if (token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				const fetchOptions: RequestInit = {
					...(config.globalOptions ?? {}),
					method: options.method ?? 'GET',
					headers: {
						...(config.globalOptions?.headers ?? {}),
						...(options.headers ?? {}),
					},
				};
			
				if (options.body) {
					fetchOptions['body'] = options.body;
				}
			
				const response = await globalThis.fetch(requestUrl.toString(), fetchOptions)
					.catch(onError);
				
				return options.processResponse(response)
					.catch(onError);
			},
		};
	};
};
