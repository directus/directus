import { InvalidIpError } from '@directus/errors';
import type { RequestHandler } from 'express';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import asyncHandler from '../utils/async-handler.js';
import { ipInNetworks } from '../utils/ip-in-networks.js';

export const checkIP: RequestHandler = asyncHandler(async (req, _res, next) => {
	const database = getDatabase();
	const logger = useLogger();

	const { role: roleId, ip } = req.accountability!;

	const query = database.select('ip_access').from('directus_roles');

	if (roleId) {
		query.where({ id: roleId });
	} else {
		query.whereNull('id');
	}

	const role: { ip_access: string | null } | undefined = await query.first();

	if (!role?.ip_access) return next();

	const ipAllowList = role.ip_access.split(',').filter((ip) => ip);

	if (ipAllowList.length > 0) {
		if (!ip) throw new InvalidIpError();

		let allowed;

		try {
			allowed = ipInNetworks(ip, ipAllowList);
		} catch (error) {
			logger.warn(`Invalid IP access configuration for role "${roleId}"`);
			logger.warn(error);

			throw new InvalidIpError();
		}

		if (!allowed) throw new InvalidIpError();
	}

	return next();
});
