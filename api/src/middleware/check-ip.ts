import { RequestHandler } from 'express';
import getDatabase from '../database';
import { InvalidIPException } from '../exceptions';
import asyncHandler from '../utils/async-handler';

export const checkIP: RequestHandler = asyncHandler(async (req, res, next) => {
	const database = getDatabase();

	const role = await database
		.select('ip_access')
		.from('directus_roles')
		.where({ id: req.accountability!.role })
		.first();

	const ipAllowlist = (role?.ip_access || '').split(',').filter((ip: string) => ip);

	if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability!.ip) === false) throw new InvalidIPException();
	return next();
});
