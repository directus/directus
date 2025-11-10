import { Url } from '../../utils/url.js';
import type { Request } from 'express';

/**
 * Generate auth callback URL from origin URL
 *
 * @param req Express request object
 * @param providerName OAuth provider name
 * @returns Url
 */
export function generateAuthCallbackUrl(req: Request, providerName: string): Url {
	const originUrl = `${req.protocol}://${req.get('host')}`;

	return new Url(originUrl).addPath('auth', 'login', providerName, 'callback');
}
