import type { RequestProxyConfig } from '../types';
import { getConfigFromEnv } from './get-config-from-env';
import env from '../env';

/**
 * Get proxy configuration for making outbound requests from the API
 * @returns Proxy object configuration, or undefined if no proxy is configured
 */
export const getProxyOptions = (): undefined | RequestProxyConfig => {
	const proxyConfig = getConfigFromEnv('REQUEST_PROXY_');

	if (!env.REQUEST_PROXY || Object.keys(proxyConfig).length === 0) {
		return undefined;
	}

	const host = env.REQUEST_PROXY_HOST;
	const port = env.REQUEST_PROXY_PORT;
	const protocol = env.REQUEST_PROXY_PROTOCOL ?? 'http';
	const username = env.REQUEST_PROXY_USERNAME;
	const password = env.REQUEST_PROXY_PASSWORD;

	if (!host) {
		throw new Error('REQUEST_PROXY_HOST is required');
	}

	if (!port) {
		throw new Error('REQUEST_PROXY_PORT is required');
	}

	if (username && !password) {
		throw new Error('REQUEST_PROXY_PASSWORD is required when using REQUEST_PROXY_USERNAME');
	}

	if (password && !username) {
		throw new Error('REQUEST_PROXY_USERNAME is required when using REQUEST_PROXY_PASSWORD');
	}

	const proxy: RequestProxyConfig = { protocol, host, port };

	if (username && password) {
		proxy.auth = { username, password };
	}

	return proxy;
};
