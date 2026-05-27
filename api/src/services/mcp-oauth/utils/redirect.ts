import { useEnv } from '@directus/env';
import { OAuthError } from '../types/error.js';
import { isDomainAllowed } from './domain.js';
import { isLoopbackHost } from './loopback.js';

const MAX_REDIRECT_URI_LENGTH = 255;

interface AllowedCustomRedirect {
	protocol: string;
	hostname: string;
}

function parseAllowedCustomRedirect(value: string): AllowedCustomRedirect | null {
	let parsed: URL;

	try {
		parsed = new URL(value);
	} catch {
		return null;
	}

	if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return null;
	if (!parsed.hostname || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash)
		return null;
	if (parsed.pathname && parsed.pathname !== '/') return null;

	return {
		protocol: parsed.protocol,
		hostname: parsed.hostname.toLowerCase(),
	};
}

function getAllowedCustomRedirects(): AllowedCustomRedirect[] {
	const values = (useEnv()['MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS'] as string[] | undefined) ?? [];

	return values.flatMap((value) => {
		const redirect = parseAllowedCustomRedirect(value);
		return redirect ? [redirect] : [];
	});
}

export function getAllowedCustomRedirectSchemes(): string[] {
	return [...new Set(getAllowedCustomRedirects().map(({ protocol }) => protocol))];
}

function isAllowedCustomRedirectUri(parsed: URL): boolean {
	if (parsed.port) return false;

	return getAllowedCustomRedirects().some(
		({ protocol, hostname }) => parsed.protocol === protocol && parsed.hostname.toLowerCase() === hostname,
	);
}

/**
 * Validate a redirect URI per RFC 6749 Section 3.1.2 + OAuth 2.1 policy (HTTPS, no fragment, no userinfo).
 * RFC 8252 Section 7.3: HTTP is allowed for loopback addresses (localhost, 127.0.0.1, [::1]).
 * Compatibility: MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS configures known custom-scheme desktop redirects.
 * Optional MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS env var enforces a server-wide domain allowlist
 * (loopback and known desktop redirects bypass the allowlist to keep native OAuth clients working).
 */
export function validateRedirectUri(uri: unknown): void {
	if (typeof uri !== 'string') {
		throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must be a string');
	}

	if (uri.length > MAX_REDIRECT_URI_LENGTH) {
		throw new OAuthError(
			400,
			'invalid_redirect_uri',
			`redirect_uri must not exceed ${MAX_REDIRECT_URI_LENGTH} characters`,
		);
	}

	let parsed: URL;

	try {
		parsed = new URL(uri);
	} catch {
		throw new OAuthError(400, 'invalid_redirect_uri', `Invalid redirect URI: ${uri}`);
	}

	// No fragment
	if (parsed.hash) {
		throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must not contain a fragment');
	}

	// No userinfo
	if (parsed.username || parsed.password) {
		throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must not contain userinfo');
	}

	if (isAllowedCustomRedirectUri(parsed)) {
		return;
	}

	// Must be HTTPS, except loopback (RFC 8252 Section 7.3)
	if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname))) {
		throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must use HTTPS (except for localhost)');
	}

	// Optional operator-defined domain allowlist. Loopback bypasses to keep native OAuth clients working.
	const allowedDomains = (useEnv()['MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS'] as string[]) ?? [];

	if (
		allowedDomains.length > 0 &&
		!isLoopbackHost(parsed.hostname) &&
		!isDomainAllowed(parsed.hostname, allowedDomains)
	) {
		throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri domain is not in the allowlist');
	}
}

/**
 * Check if a requested redirect_uri matches any registered URI.
 * RFC 6749 Section 3.1.2: exact string match for non-loopback.
 * RFC 8252 Section 7.3: loopback redirect URIs (localhost, 127.0.0.1, [::1]) MUST allow any port
 * at request time, since native apps bind to ephemeral ports.
 */
export function matchRedirectUri(requested: string, registered: string[]): boolean {
	let reqUrl: URL;

	try {
		reqUrl = new URL(requested);
	} catch {
		return false;
	}

	if (reqUrl.username || reqUrl.password || reqUrl.hash) {
		return false;
	}

	return registered.some((reg) => {
		if (reg === requested) return true;

		try {
			const regUrl = new URL(reg);

			if (isLoopbackHost(regUrl.hostname) && isLoopbackHost(reqUrl.hostname)) {
				return (
					regUrl.protocol === reqUrl.protocol &&
					regUrl.username === reqUrl.username &&
					regUrl.password === reqUrl.password &&
					regUrl.hostname === reqUrl.hostname &&
					regUrl.pathname === reqUrl.pathname &&
					regUrl.search === reqUrl.search &&
					regUrl.hash === reqUrl.hash
				);
			}
		} catch {
			// invalid URL, fall through
		}

		return false;
	});
}
