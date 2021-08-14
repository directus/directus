import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import getDatabase from '../database';

const TRUE_VALUES = [true, 1, '1', 'true', 'TRUE', 'on'];

const maintenance: RequestHandler = asyncHandler(async (req, res, next) => {
	req.maintenance = {
		enabled: false,
		role: null,
	};

	const database = getDatabase();
	const settings = await database
		.select('directus_settings.maintenance_enabled', 'directus_settings.maintenance_role')
		.from('directus_settings')
		.first();

	if (settings && TRUE_VALUES.includes(settings.maintenance_enabled)) {
		req.maintenance.enabled = true;
		req.maintenance.role = settings.maintenance_role;
	}

	res.setHeader('X-Directus-Maintenance-Mode', req.maintenance.enabled ? 1 : 0);

	return next();
});

export default maintenance;
