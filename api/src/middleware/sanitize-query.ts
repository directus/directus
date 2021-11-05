/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { sanitizeQuery } from '../utils/sanitize-query';
import { validateQuery } from '../utils/validate-query';
import { UsersService } from '../services/users';
import { RolesService } from '../services/roles';

const sanitizeQueryMiddleware: RequestHandler = async (req, res, next) => {
	req.sanitizedQuery = {};
	if (!req.query) return;

	const usersService = new UsersService({ schema: req.schema });
	const rolesService = new RolesService({ schema: req.schema });

	req.sanitizedQuery = await sanitizeQuery(
		{
			fields: req.query.fields || '*',
			...req.query,
		},
		usersService,
		rolesService,
		req.accountability || null
	);

	Object.freeze(req.sanitizedQuery);

	validateQuery(req.sanitizedQuery);

	return next();
};

export default sanitizeQueryMiddleware;
