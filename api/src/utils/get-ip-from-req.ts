import type { Request } from 'express';
import { isIP } from 'net';
import env from '../env.js';
import logger from '../logger.js';

export function getIPFromReq(req: Request): string {
	let ip = req.ip;

	if (env['IP_CUSTOM_HEADER']) {
		const customIPHeaderValue = req.get(env['IP_CUSTOM_HEADER']) as unknown;

		if (typeof customIPHeaderValue === 'string' && isIP(customIPHeaderValue) !== 0) {
			ip = customIPHeaderValue;
		} else {
			logger.warn(`Custom IP header didn't return valid IP address: ${JSON.stringify(customIPHeaderValue)}`);
		}
	}

	// IP addresses starting with ::ffff: are IPv4 addresses in IPv6 format. We can strip the prefix to get back to IPv4
	return ip.startsWith('::ffff:') ? ip.substring(7) : ip;
}
