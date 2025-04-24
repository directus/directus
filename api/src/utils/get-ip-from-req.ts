import { useEnv } from '@directus/env';
import type { Request } from 'express';
import type { IncomingMessage } from 'http';
import { isIP } from 'net';
import proxyAddr from 'proxy-addr';
import { useLogger } from '../logger/index.js';

export function getIPFromReq(req: IncomingMessage): string | null;
export function getIPFromReq(req: Request): string | null;
export function getIPFromReq(req: Request | IncomingMessage): string | null {
	const env = useEnv();
	const logger = useLogger();

	let ip: string | undefined;
	let customIPHeaderValue: unknown;

	if ('ip' in req) {
		ip = req.ip;
		customIPHeaderValue = req.get(env['IP_CUSTOM_HEADER'] as string) as unknown;
	} else {
		let trust: any = env['IP_TRUST_PROXY'];

		// booleans must be passed as a function
		if (typeof trust === 'boolean') {
			trust = () => env['IP_TRUST_PROXY'];
		}

		ip = proxyAddr(req, trust);
		customIPHeaderValue = req.headers[env['IP_CUSTOM_HEADER'] as string] as unknown;
	}

	if (env['IP_CUSTOM_HEADER']) {
		if (typeof customIPHeaderValue === 'string' && isIP(customIPHeaderValue) !== 0) {
			ip = customIPHeaderValue;
		} else {
			logger.warn(`Custom IP header didn't return valid IP address: ${JSON.stringify(customIPHeaderValue)}`);
		}
	}

	// IP addresses starting with ::ffff: are IPv4 addresses in IPv6 format. We can strip the prefix to get back to IPv4
	return ip?.startsWith('::ffff:') ? ip.substring(7) : ip ?? null;
}
