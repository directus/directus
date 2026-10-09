import type { IncomingMessage } from 'http';
import { useEnv } from '@directus/env';
import { getTrustValue } from './get-ip-from-req.js';

/**
 * Resolve the host (including port) the client connected to.
 *
 * Mirrors Express' `req.hostname` resolution: the `X-Forwarded-Host` header is
 * only honored when the immediate peer is a trusted proxy (per `IP_TRUST_PROXY`),
 * otherwise the `Host` header is used. Unlike `req.hostname`, the port is kept so
 * the value can be compared against a URL origin.
 */
export function getHostFromReq(req: IncomingMessage): string | undefined {
	const env = useEnv();
	const trust = getTrustValue(env['IP_TRUST_PROXY'] as any);

	let forwarded = req.headers['x-forwarded-host'];
	if (Array.isArray(forwarded)) forwarded = forwarded[0];

	const remoteAddress = req.socket.remoteAddress ?? '';

	let host: string | undefined;

	if (forwarded && remoteAddress && trust(remoteAddress, 0)) {
		// X-Forwarded-Host may contain a comma-separated list - use the first (original) value
		const commaIndex = forwarded.indexOf(',');
		host = commaIndex === -1 ? forwarded : forwarded.substring(0, commaIndex).trimEnd();
	} else {
		host = req.headers['host'];
	}

	return host || undefined;
}
