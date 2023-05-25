import type { Role } from '@directus/types';
import express from 'express';
import Joi from 'joi';
import { ForbiddenException, InvalidCredentialsException, InvalidPayloadException } from '../exceptions/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { AuthenticationService } from '../services/authentication.js';
import { MetaService } from '../services/meta.js';
import { RolesService } from '../services/roles.js';
import { TFAService } from '../services/tfa.js';
import { UsersService } from '../services/users.js';
import type { PrimaryKey } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = express.Router();

router.use(useCollection('directus_users'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const savedKeys: PrimaryKey[] = [];

		if (Array.isArray(req.body)) {
			const keys = await service.createMany(req.body);
			savedKeys.push(...keys);
		} else {
			const key = await service.createOne(req.body);
			savedKeys.push(key);
		}

		try {
			if (Array.isArray(req.body)) {
				const items = await service.readMany(savedKeys, req.sanitizedQuery);
				res.locals['payload'] = { data: items };
			} else {
				const item = await service.readOne(savedKeys[0]!, req.sanitizedQuery);
				res.locals['payload'] = { data: item };
			}
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new UsersService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const item = await service.readByQuery(req.sanitizedQuery);
	const meta = await metaService.getMetaForQuery('directus_users', req.sanitizedQuery);

	res.locals['payload'] = { data: item || null, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/me',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.share_scope) {
			const user = {
				share: req.accountability?.share,
				role: {
					id: req.accountability.role,
					admin_access: false,
					app_access: false,
				},
			};

			res.locals['payload'] = { data: user };
			return next();
		}

		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		try {
			const item = await service.readOne(req.accountability.user, req.sanitizedQuery);
			res.locals['payload'] = { data: item || null };
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				res.locals['payload'] = { data: { id: req.accountability.user } };
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		if (req.path.endsWith('me')) return next();

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const items = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = { data: items || null };
		return next();
	}),
	respond
);

router.patch(
	'/me',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const primaryKey = await service.updateOne(req.accountability.user, req.body);
		const item = await service.readOne(primaryKey, req.sanitizedQuery);

		res.locals['payload'] = { data: item || null };
		return next();
	}),
	respond
);

router.patch(
	'/me/track/page',
	asyncHandler(async (req, _res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.last_page) {
			throw new InvalidPayloadException(`"last_page" key is required.`);
		}

		const service = new UsersService({ schema: req.schema });
		await service.updateOne(req.accountability.user, { last_page: req.body.last_page }, { autoPurgeCache: false });

		return next();
	}),
	respond
);

router.patch(
	'/',
	validateBatch('update'),
	asyncHandler(async (req, res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		let keys: PrimaryKey[] = [];

		if (Array.isArray(req.body)) {
			keys = await service.updateBatch(req.body);
		} else if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			keys = await service.updateByQuery(sanitizedQuery, req.body.data);
		}

		try {
			const result = await service.readMany(keys, req.sanitizedQuery);
			res.locals['payload'] = { data: result };
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const primaryKey = await service.updateOne(req.params['pk']!, req.body);

		try {
			const item = await service.readOne(primaryKey, req.sanitizedQuery);
			res.locals['payload'] = { data: item || null };
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.delete(
	'/',
	validateBatch('delete'),
	asyncHandler(async (req, _res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			await service.deleteByQuery(sanitizedQuery);
		}

		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, _res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['pk']!);

		return next();
	}),
	respond
);

const inviteSchema = Joi.object({
	email: Joi.alternatives(Joi.string().email(), Joi.array().items(Joi.string().email())).required(),
	role: Joi.string().uuid({ version: 'uuidv4' }).required(),
	invite_url: Joi.string().uri(),
});

router.post(
	'/invite',
	asyncHandler(async (req, _res, next) => {
		const { error } = inviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.inviteUser(req.body.email, req.body.role, req.body.invite_url || null);
		return next();
	}),
	respond
);

const acceptInviteSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required(),
});

router.post(
	'/invite/accept',
	asyncHandler(async (req, _res, next) => {
		const { error } = acceptInviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.acceptInvite(req.body.token, req.body.password);
		return next();
	}),
	respond
);

router.post(
	'/me/tfa/generate/',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.password) {
			throw new InvalidPayloadException(`"password" is required`);
		}

		const service = new TFAService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const authService = new AuthenticationService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await authService.verifyPassword(req.accountability.user, req.body.password);

		const { url, secret } = await service.generateTFA(req.accountability.user);

		res.locals['payload'] = { data: { secret, otpauth_url: url } };
		return next();
	}),
	respond
);

router.post(
	'/me/tfa/enable/',
	asyncHandler(async (req, _res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.secret) {
			throw new InvalidPayloadException(`"secret" is required`);
		}

		if (!req.body.otp) {
			throw new InvalidPayloadException(`"otp" is required`);
		}

		// Override permissions only when enforce TFA is enabled in role
		if (req.accountability.role) {
			const rolesService = new RolesService({
				schema: req.schema,
			});

			const role = (await rolesService.readOne(req.accountability.role)) as Role;

			if (role && role.enforce_tfa) {
				const existingPermission = await req.accountability.permissions?.find(
					(p) => p.collection === 'directus_users' && p.action === 'update'
				);

				if (existingPermission) {
					existingPermission.fields = ['tfa_secret'];
					existingPermission.permissions = { id: { _eq: req.accountability.user } };
					existingPermission.presets = null;
					existingPermission.validation = null;
				} else {
					(req.accountability.permissions || (req.accountability.permissions = [])).push({
						action: 'update',
						collection: 'directus_users',
						fields: ['tfa_secret'],
						permissions: { id: { _eq: req.accountability.user } },
						presets: null,
						role: req.accountability.role,
						validation: null,
					});
				}
			}
		}

		const service = new TFAService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.enableTFA(req.accountability.user, req.body.otp, req.body.secret);

		return next();
	}),
	respond
);

router.post(
	'/me/tfa/disable',
	asyncHandler(async (req, _res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.otp) {
			throw new InvalidPayloadException(`"otp" is required`);
		}

		// Override permissions only when enforce TFA is enabled in role
		if (req.accountability.role) {
			const rolesService = new RolesService({
				schema: req.schema,
			});

			const role = (await rolesService.readOne(req.accountability.role)) as Role;

			if (role && role.enforce_tfa) {
				const existingPermission = await req.accountability.permissions?.find(
					(p) => p.collection === 'directus_users' && p.action === 'update'
				);

				if (existingPermission) {
					existingPermission.fields = ['tfa_secret'];
					existingPermission.permissions = { id: { _eq: req.accountability.user } };
					existingPermission.presets = null;
					existingPermission.validation = null;
				} else {
					(req.accountability.permissions || (req.accountability.permissions = [])).push({
						action: 'update',
						collection: 'directus_users',
						fields: ['tfa_secret'],
						permissions: { id: { _eq: req.accountability.user } },
						presets: null,
						role: req.accountability.role,
						validation: null,
					});
				}
			}
		}

		const service = new TFAService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const otpValid = await service.verifyOTP(req.accountability.user, req.body.otp);

		if (otpValid === false) {
			throw new InvalidPayloadException(`"otp" is invalid`);
		}

		await service.disableTFA(req.accountability.user);
		return next();
	}),
	respond
);

router.post(
	'/:pk/tfa/disable',
	asyncHandler(async (req, _res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.accountability.admin || !req.params['pk']) {
			throw new ForbiddenException();
		}

		const service = new TFAService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.disableTFA(req.params['pk']);
		return next();
	}),
	respond
);

export default router;
