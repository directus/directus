import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { useLogger } from '../../logger/index.js';
import isUrlAllowed from '../../utils/is-url-allowed.js';
import type { Request } from 'express';

export function isLoginRedirectAllowed(redirect: unknown, request: Request, provider: string): boolean {
	if (!redirect) return true; // empty redirect
	if (typeof redirect !== 'string') return false; // invalid type

	const env = useEnv();
	const publicUrl = env['PUBLIC_URL'] as string;

	if (URL.canParse(redirect) === false) {
		if (redirect.startsWith('//') === false) {
			// should be a relative path like `/admin/test`
			return true;
		}

		// domain without protocol `//example.com/test`
		return false;
	}

	const { protocol: redirectProtocol, host: redirectHost } = new URL(redirect);

	if (`${redirectProtocol}//${redirectHost}` !== `${request.protocol}://${request.get('host')}`) return false;

	const envKey = `AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`;

	if (envKey in env) {
		if (isUrlAllowed(redirect, toArray(env[envKey] as string))) return true;
	}

	if (URL.canParse(publicUrl) === false) {
		useLogger().error('Invalid PUBLIC_URL for login redirect');
		return false;
	}

	// allow redirects to the defined PUBLIC_URL
	const { protocol: publicProtocol, hostname: publicDomain } = new URL(publicUrl);

	return `${redirectProtocol}//${redirectHost}` === `${publicProtocol}//${publicDomain}`;
}
