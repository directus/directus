import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as UsersService from '../services/users';
import Joi from '@hapi/joi';
import { InvalidPayloadException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import * as ActivityService from '../services/activity';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const item = await UsersService.createUser(req.body, res.locals.query);

		ActivityService.createActivity({
			action: ActivityService.Action.CREATE,
			collection: req.collection,
			item: item.id,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

		return res.json({ data: item });
	})
);

router.get(
	'/',
	useCollection('directus_users'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const item = await UsersService.readUsers(res.locals.query);

		return res.json({ data: item });
	})
);

router.get(
	'/:pk',
	useCollection('directus_users'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const items = await UsersService.readUser(req.params.pk, res.locals.query);
		return res.json({ data: items });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		const item = await UsersService.updateUser(req.params.pk, req.body, res.locals.query);

		ActivityService.createActivity({
			action: ActivityService.Action.UPDATE,
			collection: req.collection,
			item: item.id,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

		return res.json({ data: item });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_users'),
	asyncHandler(async (req, res) => {
		await UsersService.deleteUser(req.params.pk);

		ActivityService.createActivity({
			action: ActivityService.Action.DELETE,
			collection: req.collection,
			item: req.params.pk,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: req.user,
		});

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
