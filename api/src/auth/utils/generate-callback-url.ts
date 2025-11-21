import { useEnv } from '@directus/env';
import { Url } from '../../utils/url.js';

/**
 * Generate callback URL from public URL
 *
 * @param providerName OAuth provider name
 * @returns callback URL
 */
export function generateCallbackUrl(providerName: string): string {
	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	return new Url(publicUrl).addPath('auth', 'login', providerName, 'callback').toString();
}
