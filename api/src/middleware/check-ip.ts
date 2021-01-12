import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import database from '../database';
import { InvalidIPException } from '../exceptions';

export const checkIP: RequestHandler = asyncHandler(async (req, res, next) => {
	const role = await database
		.select('ip_access')
		.from('directus_roles')
		.where({ id: req.accountability!.role })
		.first();

	const ipAllowlist = (role?.ip_access || '').split(',').filter((ip: string) => ip);

	if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability!.ip) === false) throw new InvalidIPException();
	return next();
});
