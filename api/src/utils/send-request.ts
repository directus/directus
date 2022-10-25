import axios from 'axios';
import env from '../env';
import { RequestConfig, RequestProxyConfig } from '../types';
import { getConfigFromEnv } from './get-config-from-env';

/* The sense behind returning false:
 * So if you are on a unix enviorenment, you are able to configure your proxy system wide.
 * But there is no continuty. Sometimes the configuration is in UPPERCASE sometimes in lowercase.
 * And this really matters for some libs out there.
 * So false means: Do not use any of the env variables out there. Just do nothing. My system is configured properly.
 * see: https://about.gitlab.com/blog/2021/01/27/we-need-to-talk-no-proxy/
 *
 * Remarks to undici: In undici, we are in a very low level to fetch api.
 * So there is no "magic" going on. Means that if you want to use an other proxy then systemproxy.
 * You have to configure it. There is no auto parsing for HTTP_PROXY/http_proxy or something else.
 *
 * So - line 20 and 21 could be removed, line 24 should be false. -> use proxy? yes -> config please!
 */
function getProxyOptions(): false | RequestProxyConfig | undefined {
	const useSystemProxy = env.REQUEST_PROXY === false;
	if (useSystemProxy) return false;

	const hasGlobalProxy = Object.keys(getConfigFromEnv('REQUEST_PROXY_')).length > 0;
	if (!hasGlobalProxy) return undefined;

	// proxy configuration
	const proxyProtocol = env.REQUEST_PROXY_PROTOCOL ?? 'http';
	const proxyHost = env.REQUEST_PROXY_HOST;
	const proxyPort = env.REQUEST_PROXY_PORT;
	const proxyAuth = getConfigFromEnv('REQUEST_PROXY_AUTH_');
	const proxyUsername = env.REQUEST_PROXY_AUTH_USERNAME;
	const proxyPassword = env.REQUEST_PROXY_AUTH_PASSWORD;

	// proxy validation
	if (!proxyHost || !proxyPort) {
		throw new Error(
			`REQUEST_PROXY_HOST and REQUEST_PROXY_PORT are required, if you specify proxy configuration as an object.`
		);
	}
	if (Object.keys(proxyAuth).length === 1) {
		throw new Error(
			`REQUEST_PROXY_AUTH_USERNAME and REQUEST_PROXY_AUTH_PASSWORD are required, if you specify proxy authentication.`
		);
	}

	const proxy: RequestProxyConfig = {
		protocol: proxyProtocol,
		host: proxyHost,
		port: proxyPort,
	};

	if (proxyUsername && proxyPassword) {
		proxy.auth = {
			username: proxyUsername,
			password: proxyPassword,
		};
	}
	return proxy;
}

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
