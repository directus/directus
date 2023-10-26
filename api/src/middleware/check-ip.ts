import type { RequestHandler } from 'express';
import getDatabase from '../database/index.js';
import { InvalidIpError } from '@directus/errors';
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

	if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability!.ip) === false) throw new InvalidIpError();
	return next();
});
