import { Request } from 'express';
import { isIP } from 'net';
import env from '../env';
import logger from '../logger';

export function getIPFromReq(req: Request): string {
	let ip = req.ip;

	if (env.IP_CUSTOM_HEADER) {
		const customIPHeaderValue = req.get(env.IP_CUSTOM_HEADER) as unknown;

		if (typeof customIPHeaderValue === 'string' && isIP(customIPHeaderValue) !== 0) {
			ip = customIPHeaderValue;
		} else {
			logger.warn(`Custom IP header didn't return valid IP address: ${JSON.stringify(customIPHeaderValue)}`);
		}
	}

	return ip.startsWith('::ffff:') ? ip.substring(7) : ip;
}
