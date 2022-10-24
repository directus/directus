import axios from 'axios';
import env from '../env';
import { RequestConfig } from '../types';
import { getConfigFromEnv } from './get-config-from-env';

export async function sendRequest(config: RequestConfig) {
	const { method, url, data, headers = {}, options = {} } = config;

	// set config by "priority" -> Prio 1: handler options / Prio 2: global options
	const proxy: boolean | any = options.proxy ?? getConfigFromEnv('REQUEST_PROXY_') ?? env.REQUEST_PROXY; // default: false -> (use system proxy)
	const timeout: number = options.timeout ?? env.REQUEST_TIMEOUT; // default: 1000 * 60 * 3
	const maxRedirects: number = options.maxRedirects ?? env.REQUEST_MAX_REDIRECTS; // default: 5

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
