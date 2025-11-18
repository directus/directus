import { Url } from '../../utils/url.js';
/**
 * Generate callback URL from origin
 *
 * @param string Origin URL
 * @param providerName OAuth provider name
 * @returns url
 */
export function generateCallbackUrl(providerName: string, originUrl: string): string {
	return new Url(originUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
