import { InvalidIpError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { matches } from 'ip-matching';
import getDatabase from '../database/index.js';
import asyncHandler from '../utils/async-handler.js';

export const checkIP: RequestHandler = asyncHandler(async (req, _res, next) => {
	const database = getDatabase();

	const query = database.select('ip_access').from('directus_roles');

	if (req.accountability!.role) {
		query.where({ id: req.accountability!.role });
	} else {
		query.whereNull('id');
	}

	const role = await query.first();

	const ipAllowlist = (role?.ip_access || '').split(',').filter((ip: string) => ip);

	for (const allowedIp of ipAllowlist) {
		if (allowedIp && req.accountability!.ip && !matches(req.accountability!.ip, allowedIp)) {
			throw new InvalidIpError();
		}
	}

	return next();
});
