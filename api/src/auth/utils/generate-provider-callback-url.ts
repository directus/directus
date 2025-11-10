import { Url } from '../../utils/url.js';
import type { Request } from 'express';

/**
 * Generate provider callback URL from origin URL
 *
 * @param req Express request object
 * @param providerName OAuth provider name
 * @returns url
 */
export function generateProviderCallbackUrl(req: Request, providerName: string): string {
	const originUrl = `${req.protocol}://${req.get('host')}`;

	return new Url(originUrl).addPath('auth', 'login', providerName, 'callback').toString()
}
