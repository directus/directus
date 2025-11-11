import { Url } from '../../utils/url.js';
/**
 * Generate redirect URL from origin
 *
 * @param string Origin URL
 * @param providerName OAuth provider name
 * @returns url
 */
export function generateRedirectUrl(originUrl: string, providerName: string): string {
	return new Url(originUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
