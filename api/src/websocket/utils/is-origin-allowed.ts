import type { IncomingMessage } from 'http';
import { useEnv } from '@directus/env';
import { getHostFromReq } from '../../utils/get-host-from-req.js';

/**
 * Validate the `Origin` header of a WebSocket upgrade request to prevent
 * Cross-Site WebSocket Hijacking (CWE-352).
 *
 * The browser automatically attaches the victim's session cookie to a WebSocket
 * handshake, so without an origin check a page on an attacker-controlled origin
 * could open an authenticated socket to the Directus instance. The HTTP CORS
 * middleware does not cover the upgrade path, so the equivalent gate is applied
 * here.
 *
 * An origin is considered allowed when:
 * - There is no `Origin` header. Non-browser/server-to-server clients don't send
 *   one, and they are not subject to the browser's automatic cookie attachment
 *   that makes CSWSH possible.
 * - The origin matches the host the request was sent to (same-origin). A browser
 *   cannot forge the `Origin` header, so a cross-origin attacker's origin never
 *   matches the victim instance's own host.
 * - The origin matches the configured `PUBLIC_URL`, covering reverse-proxy setups
 *   where the public host differs from the internal request host.
 * - The origin matches the `CORS_ORIGIN` allowlist (when `CORS_ENABLED` is set),
 *   mirroring the protection the `cors` middleware provides for the HTTP transport.
 */
export function isOriginAllowed(request: IncomingMessage): boolean {
	const origin = request.headers['origin'];

	// Non-browser clients (e.g. server-to-server) don't send an Origin header and
	// aren't vulnerable to CSWSH, so allow them through.
	if (!origin) return true;

	let originUrl: URL;

	try {
		originUrl = new URL(origin);
	} catch {
		// Malformed Origin header - reject.
		return false;
	}

	// Same-origin: the Origin host matches the host the request was sent to.
	// The effective host honors IP_TRUST_PROXY (X-Forwarded-Host) like the rest
	// of the request pipeline.
	const host = getHostFromReq(request);
	if (host && originUrl.host === host) return true;

	const env = useEnv();

	// Configured PUBLIC_URL (handles reverse-proxy deployments).
	const publicUrl = env['PUBLIC_URL'];

	if (typeof publicUrl === 'string' && URL.canParse(publicUrl) && new URL(publicUrl).origin === originUrl.origin) {
		return true;
	}

	// Fall back to the CORS allowlist so operators have a single source of truth.
	if (env['CORS_ENABLED'] !== true) return false;

	return matchesCorsOrigin(env['CORS_ORIGIN'], origin);
}

/**
 * Match an origin against a `CORS_ORIGIN` value, mirroring the semantics of the
 * `cors` middleware (which the env caster can produce as a boolean, string,
 * RegExp, or an array of those).
 *
 * Two `cors` behaviors are intentionally *not* mirrored, because they would open
 * the authenticated WebSocket transport to every origin:
 *
 * - A literal `*` wildcard. CORS forbids combining `Access-Control-Allow-Origin:
 *   *` with credentials, so `*` never authorizes a credentialed cross-origin
 *   request over HTTP - it must not authorize the always-credentialed WS either.
 * - Falsy values (`false`, `''`, ...). `cors` reflects these to `*` (allow any,
 *   sans credentials); here they deny, which is both the secure default and what
 *   a cross-origin deployment would express via `CORS_ORIGIN=true` instead.
 *
 * `CORS_ORIGIN=true` (reflect the request origin) is the one value that, with
 * credentials, genuinely permits credentialed cross-origin access, so it is the
 * only "allow any" value honored here.
 */
function matchesCorsOrigin(corsOrigin: unknown, origin: string): boolean {
	if (Array.isArray(corsOrigin)) {
		return corsOrigin.some((entry) => matchesCorsOrigin(entry, origin));
	}

	if (corsOrigin instanceof RegExp) return corsOrigin.test(origin);

	if (typeof corsOrigin === 'string') {
		if (corsOrigin === '*') return false;
		return corsOrigin === origin;
	}

	return corsOrigin === true;
}
