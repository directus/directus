import type { StaticTokenClient } from '../auth/types.js';
import type { DirectusClient } from '../types/client.js';
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
				if (!options.headers) options.headers = {};

				if ('Content-Type' in options.headers === false) {
					options.headers['Content-Type'] = 'application/json';
				} else if (options.headers['Content-Type'] === 'multipart/form-data') {
					// let the fetch function deal with multipart boundaries
					delete options.headers['Content-Type'];
				}

				// we need to use THIS here instead of client to access overridden functions
				if ('getToken' in this) {
					const token = await (this.getToken as StaticTokenClient<Schema>['getToken'])();

					if (token) {
						if (!options.headers) options.headers = {};
						options.headers['Authorization'] = `Bearer ${token}`;
					}
				}

				const requestUrl = getRequestUrl(client.url, options.path, options.params);

				let fetchOptions: RequestInit = {
					method: options.method ?? 'GET',
					headers: options.headers ?? {},
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

				//const onError = config.onError ?? ((_err: any) => undefined);
				let onResponse: ResponseTransformer | undefined | null;

				// chain response handlers if needed
				if (config.onResponse && options.onResponse) {
					onResponse = ((data: any) =>
						Promise.resolve(data).then(config.onResponse).then(options.onResponse)) as ResponseTransformer;
				} else if ('onResponse' in options) {
					onResponse = options.onResponse;
				} else if ('onResponse' in config) {
					onResponse = config.onResponse;
				}

				const response = await request(requestUrl.toString(), fetchOptions, onResponse); //.catch(onError);

				return response as Output;
			},
		};
	};
};
