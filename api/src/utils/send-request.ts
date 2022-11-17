import axios from 'axios';
import { getEnv } from '../env';
import { RequestConfig } from '../types';
import { getProxyOptions } from './get-proxy-options';

export const sendRequest = async (config: RequestConfig) => {
	const { method, url, data, headers = {}, options = {} } = config;

	const env = getEnv();
	const proxy = getProxyOptions();

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
};
