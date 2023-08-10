import type { RequestHandler } from 'express';
import env from '../env.js';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import { InvalidIpError } from '../errors/index.js';
import asyncHandler from '../utils/async-handler.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';

export const checkIP: RequestHandler = asyncHandler(async (req, _res, next) => {
	// If there is no accountability or ip, skip this middleware
	if (!req.accountability!.ip) return next();

	let ip_access = req.accountability?.ip_access;

	if (ip_access === undefined) {
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
				cache.set(`ip_access:${req.accountability!.role}`, role, getMilliseconds(env['CACHE_ACCESS_TTL']));
			}
		}

		ip_access = role?.ip_access;
	}

	const ipAllowlist = (ip_access || '').split(',').filter((ip: string) => ip);

	if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability!.ip) === false) throw new InvalidIpError();
	return next();
});
