import { RequestHandler } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import getDatabase from '../database';
import env from '../env';
import { InvalidCredentialsException } from '../exceptions';
import asyncHandler from '../utils/async-handler';
import isDirectusJWT from '../utils/is-directus-jwt';
import { Permission } from '@directus/shared/types';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { mergePermissions } from '../utils/merge-permissions';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
const authenticate: RequestHandler = asyncHandler(async (req, res, next) => {
	req.accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip,
		userAgent: req.get('user-agent'),
	};

	if (!req.token) return next();

	const database = getDatabase();

	if (isDirectusJWT(req.token)) {
		let payload: { id: string };

		try {
			payload = jwt.verify(req.token, env.SECRET as string, { issuer: 'directus' }) as { id: string };
		} catch (err: any) {
			if (err instanceof TokenExpiredError) {
				throw new InvalidCredentialsException('Token expired.');
			} else if (err instanceof JsonWebTokenError) {
				throw new InvalidCredentialsException('Token invalid.');
			} else {
				throw err;
			}
		}

		const user = await database
			.select('directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({
				'directus_users.id': payload.id,
				status: 'active',
			})
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		req.accountability.user = payload.id;
		req.accountability.role = user.role;
		req.accountability.admin = user.admin_access === true || user.admin_access == 1;
		req.accountability.app = user.app_access === true || user.app_access == 1;
	} else {
		// Try finding the user with the provided token
		const user = await database
			.select('directus_users.id', 'directus_users.role', 'directus_roles.admin_access', 'directus_roles.app_access')
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({
				'directus_users.token': req.token,
				status: 'active',
			})
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		req.accountability.user = user.id;
		req.accountability.role = user.role;
		req.accountability.admin = user.admin_access === true || user.admin_access == 1;
		req.accountability.app = user.app_access === true || user.app_access == 1;
	}

	let permissions: Permission[] = [];

	if (req.accountability.admin !== true) {
		const permissionsForRole = await database
			.select('*')
			.from('directus_permissions')
			.where({ role: req.accountability.role });

		permissions = permissionsForRole.map((permissionRaw) => {
			if (permissionRaw.permissions && typeof permissionRaw.permissions === 'string') {
				permissionRaw.permissions = JSON.parse(permissionRaw.permissions);
			} else if (permissionRaw.permissions === null) {
				permissionRaw.permissions = {};
			}

			if (permissionRaw.validation && typeof permissionRaw.validation === 'string') {
				permissionRaw.validation = JSON.parse(permissionRaw.validation);
			} else if (permissionRaw.validation === null) {
				permissionRaw.validation = {};
			}

			if (permissionRaw.presets && typeof permissionRaw.presets === 'string') {
				permissionRaw.presets = JSON.parse(permissionRaw.presets);
			} else if (permissionRaw.presets === null) {
				permissionRaw.presets = {};
			}

			if (permissionRaw.fields && typeof permissionRaw.fields === 'string') {
				permissionRaw.fields = permissionRaw.fields.split(',');
			} else if (permissionRaw.fields === null) {
				permissionRaw.fields = [];
			}

			return permissionRaw;
		});

		if (req.accountability.app === true) {
			permissions = mergePermissions(
				permissions,
				appAccessMinimalPermissions.map((perm) => ({ ...perm, role: req.accountability!.role }))
			);
		}
	}

	req.accountability.permissions = permissions;

	return next();
});

export default authenticate;
