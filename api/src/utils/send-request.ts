import axios from 'axios';
import env from '../env';
import { RequestConfig, RequestProxyConfig } from '../types';
import { getConfigFromEnv } from './get-config-from-env';
import { getProxyOptions } from './get-proxy-options';

export async function sendRequest(config: RequestConfig) {
	const { method, url, data, headers = {}, options = {} } = config;

	const proxy = getProxyOptions();

	// preperation for undici

	// if (typeof proxy === 'object') {
	// 	const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
	// 	if (proxy.auth) {
	// 		const basicAuth = Buffer.from(`${proxy.auth.username}:${proxy.auth.password}`).toString('base64');
	// 		headers['proxy-authorization'] = `Basic ${basicAuth}`;
	// 	}
	//  const client = new Client(proxyUrl)
	//	request = client.request
	// }

	const timeout: number = options.timeout ?? env.REQUEST_TIMEOUT;
	const maxRedirects: number = options.maxRedirects ?? env.REQUEST_MAX_REDIRECTS;

	const result = await axios.request({
		url,
		method,
		data,
		headers,
		proxy,
		timeout,
		maxRedirects,
	});

	return { status: result.status, data: result.data, statusText: result.statusText, headers: result.headers };
}
