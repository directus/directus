import type { DirectusClient } from '../client.js';
import type { ResponseTransformer } from '../index.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestClient, RestCommand, RestConfig } from './types.js';

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

				// all api requests require this content type
				if (!options.headers?.['Content-Type']) {
					if (!options.headers) options.headers = {};
					options.headers['Content-Type'] = 'application/json';
				}

				// we need to use THIS here instead of client allow for overridden functions
				const self = this as RestClient<Schema> & DirectusClient<Schema>;
				const token = await self.getToken();

				if (token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${token}`;
				}

				const requestUrl = getRequestUrl(client.url, options.path, options.params);

				let fetchOptions: RequestInit = {
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

				// apply onRequest hook from command
				if (options.onRequest) {
					fetchOptions = await options.onRequest(fetchOptions);
				}

				// apply global onRequest hook
				if (config.onRequest) {
					fetchOptions = await config.onRequest(fetchOptions);
				}

				const onError = config.onError ?? ((_err: any) => undefined);
				let onResponse: ResponseTransformer | undefined;

				// chain response parsers if needed
				if (config.onResponse && options.onResponse) {
					onResponse = ((data: any) => Promise.resolve(data).then(options.onResponse).then(config.onResponse)) as ResponseTransformer;
				} else if (options.onResponse) {
					onResponse = options.onResponse;
				} else if (config.onResponse) {
					onResponse = config.onResponse;
				}

				const response = await request(requestUrl.toString(), fetchOptions, onResponse)
					.catch(onError);
				
				return response as Output;
			},
		};
	};
};
