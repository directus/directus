import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import Joi from 'joi';
import { InvalidPayloadException, InvalidCredentialsException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import UsersService from '../services/users';
import MetaService from '../services/meta';

const router = express.Router();

router.use(useCollection('directus_users'));

router.post(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new UsersService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);
		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new UsersService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const item = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({ data: item || null, meta });
	})
);

router.get(
	'/me',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}
		const service = new UsersService({ accountability: req.accountability });

		const item = await service.readByKey(req.accountability.user, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new UsersService({ accountability: req.accountability });
		const items = await service.readByKey(req.params.pk, req.sanitizedQuery);
		return res.json({ data: items || null });
	})
);

router.patch(
	'/me',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		const service = new UsersService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.accountability.user);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.patch(
	'/me/track/page',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsException();
		}

		if (!req.body.last_page) {
			throw new InvalidPayloadException(`"last_page" key is required.`);
		}

		const service = new UsersService();
		await service.update({ last_page: req.body.last_page }, req.accountability.user);

		return res.status(200).end();
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new UsersService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);

		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new UsersService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return res.status(200).end();
	})
);

const inviteSchema = Joi.object({
	email: Joi.string().email().required(),
	role: Joi.string().uuid({ version: 'uuidv4' }).required(),
});

router.post(
	'/invite',
	asyncHandler(async (req, res) => {
		const { error } = inviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const service = new UsersService({ accountability: req.accountability });
		await service.inviteUser(req.body.email, req.body.role);
		res.end();
	})
);

const acceptInviteSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required(),
});

router.post(
	'/invite/accept',
	asyncHandler(async (req, res) => {
		const { error } = acceptInviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);
		const service = new UsersService({ accountability: req.accountability });
		await service.acceptInvite(req.body.token, req.body.password);
		res.end();
	})
);

export default router;
