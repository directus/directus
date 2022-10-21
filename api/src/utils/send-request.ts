import axios from 'axios';
import { RequestConfig } from '../types';
import { getConfigFromEnv } from './get-config-from-env';

export async function sendRequest(config: RequestConfig) {
	const { method, url, data, headers = {}, options = {} } = config;

	const envConfig = getConfigFromEnv('REQUEST_') ?? {};
	const additionalOptions = Object.assign({}, envConfig, options);

	/* We may or may not keep using axios internally
	 * so this is a more generic way to handle optional
	 * options for any http-handler.
	 */

	// --> node-fetch implementation

	// const response = await fetch(url, {
	// 	...additionalOptions,
	// 	method,
	// 	data: JSON.stringify(data),
	// 	headers,
	// });
	// const result = await response.json();
	// return { status: response.status, data: result, statusText: response.statusText, headers: response.headers.raw() };

	// --> axios implementation
	const result = await axios.request({
		...additionalOptions,
		url,
		method,
		data,
		headers,
	});

	return { status: result.status, data: result.data, statusText: result.statusText, headers: result.headers };
}
