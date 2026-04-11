import { isLoopbackHost } from './loopback.js';

/**
 * Check if a requested redirect_uri matches any registered URI.
 * RFC 6749 Section 3.1.2: exact string match for non-loopback.
 * RFC 8252 Section 7.3: loopback redirect URIs (localhost, 127.0.0.1, [::1]) MUST allow any port
 * at request time, since native apps bind to ephemeral ports.
 */
export function matchRedirectUri(requested: string, registered: string[]): boolean {
	return registered.some((reg) => {
		if (reg === requested) return true;

		try {
			const regUrl = new URL(reg);
			const reqUrl = new URL(requested);

			if (isLoopbackHost(regUrl.hostname)) {
				return (
					regUrl.protocol === reqUrl.protocol &&
					regUrl.hostname === reqUrl.hostname &&
					regUrl.pathname === reqUrl.pathname
				);
			}
		} catch {
			// invalid URL, fall through
		}

		return false;
	});
}
