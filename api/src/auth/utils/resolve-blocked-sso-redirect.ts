import { getSecret } from '../../utils/get-secret.js';
import { verifyJWT } from '../../utils/jwt.js';
import { resolveLoginRedirect } from './resolve-login-redirect.js';

export function resolveBlockedSSORedirect(redirect: unknown, provider: string): string | undefined {
	if (!redirect) return undefined;

	try {
		return resolveLoginRedirect(redirect, { provider });
	} catch {
		return undefined;
	}
}

export function resolveBlockedSSORedirectFromStateCookie(
	cookie: string | undefined,
	provider: string,
): string | undefined {
	if (!cookie) return undefined;

	try {
		const tokenData = verifyJWT(cookie, getSecret()) as { redirect?: unknown };
		return resolveBlockedSSORedirect(tokenData.redirect, provider);
	} catch {
		return undefined;
	}
}
