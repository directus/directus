import express from 'express';
import asyncHandler from '../utils/async-handler';
import Joi from 'joi';
import { InvalidPayloadException, InvalidCredentialsException, ForbiddenException } from '../exceptions';
import { UsersService, MetaService, AuthenticationService } from '../services';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { PrimaryKey } from '../types';

const router = express.Router();

router.use(useCollection('directus_users'));

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const primaryKey = await service.create(req.body);

		try {
			const item = await service.readByKey(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: item || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
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

		res.locals.payload = { data: item || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/me',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		try {
			const item = await service.readByKey(req.accountability.user, req.sanitizedQuery);
			res.locals.payload = { data: item || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				res.locals.payload = { data: { id: req.accountability.user } };
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
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const items = await service.readByKey(pk as any, req.sanitizedQuery);
		res.locals.payload = { data: items || null };
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
		const primaryKey = await service.update(req.body, req.accountability.user);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = { data: item || null };
		return next();
	}),
	respond
);

router.patch(
	'/me/track/page',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.last_page) {
			throw new InvalidPayloadException(`"last_page" key is required.`);
		}

		const service = new UsersService({ schema: req.schema });
		await service.update({ last_page: req.body.last_page }, req.accountability.user);

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
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const primaryKey = await service.update(req.body, pk as any);

		try {
			const item = await service.readByKey(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: item || null };
		} catch (error) {
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
	asyncHandler(async (req, res, next) => {
		if (!req.body || Array.isArray(req.body) === false) {
			throw new InvalidPayloadException(`Body has to be an array of primary keys`);
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.delete(req.body as PrimaryKey[]);

		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		await service.delete(pk as any);

		return next();
	}),
	respond
);

const inviteSchema = Joi.object({
	email: Joi.alternatives(Joi.string().email(), Joi.array().items(Joi.string().email())).required(),
	role: Joi.string().uuid({ version: 'uuidv4' }).required(),
});

router.post(
	'/invite',
	asyncHandler(async (req, res, next) => {
		const { error } = inviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.inviteUser(req.body.email, req.body.role);
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
	asyncHandler(async (req, res, next) => {
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
	'/me/tfa/enable/',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.password) {
			throw new InvalidPayloadException(`"password" is required`);
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const authService = new AuthenticationService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await authService.verifyPassword(req.accountability.user, req.body.password);

		const { url, secret } = await service.enableTFA(req.accountability.user);

		res.locals.payload = { data: { secret, otpauth_url: url } };
		return next();
	}),
	respond
);

router.post(
	'/me/tfa/disable',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.otp) {
			throw new InvalidPayloadException(`"otp" is required`);
		}

		const service = new UsersService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const authService = new AuthenticationService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const otpValid = await authService.verifyOTP(req.accountability.user, req.body.otp);

		if (otpValid === false) {
			throw new InvalidPayloadException(`"otp" is invalid`);
		}

		await service.disableTFA(req.accountability.user);
		return next();
	}),
	respond
);

export default router;
