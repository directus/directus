import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as UsersService from '../services/users';
import Joi from '@hapi/joi';
import { InvalidPayloadException, InvalidCredentialsException } from '../exceptions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_users'));

router.post(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await UsersService.createUser(req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await UsersService.readUser(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const item = await UsersService.readUsers(req.sanitizedQuery, { role: req.role });
		return res.json({ data: item || null });
	})
);

router.get(
	'/me',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.user) {
			throw new InvalidCredentialsException();
		}

		const item = await UsersService.readUser(req.user, req.sanitizedQuery, { role: req.role });
		return res.json({ data: item || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const items = await UsersService.readUser(req.params.pk, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: items || null });
	})
);

router.patch(
	'/me',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.user) {
			throw new InvalidCredentialsException();
		}

		const primaryKey = await UsersService.updateUser(req.user, req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await UsersService.readUser(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await UsersService.updateUser(req.params.pk, req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await UsersService.readUser(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await UsersService.deleteUser(req.params.pk, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
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
	asyncHandler(async (req, res) => {
		const { error } = inviteSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);
		await UsersService.inviteUser(req.body.email, req.body.role, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
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
		await UsersService.acceptInvite(req.body.token, req.body.password);
		res.end();
	})
);

export default router;
