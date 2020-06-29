import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as UsersService from '../services/users';
import Joi from '@hapi/joi';
import { InvalidPayloadException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const records = await UsersService.createUser(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	useCollection('directus_users'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await UsersService.readUsers(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_users'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await UsersService.readUser(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const records = await UsersService.updateUser(req.params.pk, req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		await UsersService.deleteUser(req.params.pk);
		return res.status(200).end();
	})
);

const inviteSchema = Joi.object({
	email: Joi.string().email().required(),
	role: Joi.string().uuid({ version: 'uuidv4' }).required(),
});

router.post(
	'/invite',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const { error } = inviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);
		await UsersService.inviteUser(req.body.email, req.body.role);
		res.end();
	})
);

const acceptInviteSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required(),
});

router.post(
	'/invite/accept',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const { error } = acceptInviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);
		await UsersService.acceptInvite(req.body.token, req.body.password);
		res.end();
	})
);

export default router;
