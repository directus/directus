import type { Accountability } from '@directus/types';
import type { Request } from 'express';
import { isEqual } from 'lodash-es';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';

/**
 * Get accountability for request / token.
 *
 * @throws If provided token is invalid.
 */
export async function getAccountability(req: Request, token: string | null) {
	const defaultAccountability: Accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: getIPFromReq(req),
	};

	const userAgent = req.get('user-agent')?.substring(0, 1024);
	if (userAgent) defaultAccountability.userAgent = userAgent;

	const origin = req.get('origin');
	if (origin) defaultAccountability.origin = origin;

	const database = getDatabase();

	const customAccountability = await emitter.emitFilter(
		'authenticate',
		defaultAccountability,
		{
			req,
		},
		{
			database,
			schema: null,
			accountability: null,
		},
	);

	if (customAccountability && !isEqual(customAccountability, defaultAccountability)) return customAccountability;

	if (!token) return defaultAccountability;

	return getAccountabilityForToken(token, defaultAccountability);
}
