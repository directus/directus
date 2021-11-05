import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import { UsersService } from '../services/users';
import { RolesService } from '../services/roles';

export const loadUserRoleServices: RequestHandler = asyncHandler(async (req, res, next) => {
	req.usersService = new UsersService({ schema: req.schema });
	req.rolesService = new RolesService({ schema: req.schema });
	return next();
});
