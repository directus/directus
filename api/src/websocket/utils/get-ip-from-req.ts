import { useEnv } from '@directus/env';
import type { IncomingMessage } from 'http';
import { isIP } from 'net';
import proxyAddr from 'proxy-addr';
import { useLogger } from '../../logger/index.js';

export function getIPFromReq(req: IncomingMessage): string | null {
	const env = useEnv();
	const logger = useLogger();

	let trust: any = env['IP_TRUST_PROXY'];

	// booleans must be passed as a function
	if (typeof trust === 'boolean') {
		trust = () => env['IP_TRUST_PROXY'];
	}

	let ip = proxyAddr(req, trust);

	if (env['IP_CUSTOM_HEADER']) {
		const customIPHeaderValue = req.headers[env['IP_CUSTOM_HEADER'] as string] as unknown;

		if (typeof customIPHeaderValue === 'string' && isIP(customIPHeaderValue) !== 0) {
			ip = customIPHeaderValue;
		} else {
			logger.warn(`Custom IP header didn't return valid IP address: ${JSON.stringify(customIPHeaderValue)}`);
		}
	}

	// IP addresses starting with ::ffff: are IPv4 addresses in IPv6 format. We can strip the prefix to get back to IPv4
	return ip?.startsWith('::ffff:') ? ip.substring(7) : ip ?? null;
}
