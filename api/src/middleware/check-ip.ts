import type { RequestHandler } from 'express';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import { InvalidIpError } from '../errors/index.js';
import asyncHandler from '../utils/async-handler.js';

export const checkIP: RequestHandler = asyncHandler(async (req, _res, next) => {
	const { cache } = getCache();
	let role: any = cache ? cache.get(`ip_access:${req.accountability!.role}`) : null;

	if (!role) {
		const database = getDatabase();

		const query = database.select('ip_access').from('directus_roles');

		if (req.accountability!.role) {
			query.where({ id: req.accountability!.role });
		} else {
			query.whereNull('id');
		}

		role = await query.first();

		if (cache) {
			cache.set(`ip_access:${req.accountability!.role}`, role, 10000);
		}
	}

	const ipAllowlist = (role?.ip_access || '').split(',').filter((ip: string) => ip);

	if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability!.ip) === false) throw new InvalidIpError();
	return next();
});
