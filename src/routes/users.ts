import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as UsersService from '../services/users';
import Joi from '@hapi/joi';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const records = await UsersService.createUser(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await UsersService.readUsers(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await UsersService.readUser(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const records = await UsersService.updateUser(req.params.pk, req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
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
	asyncHandler(async (req, res) => {
		await inviteSchema.validateAsync(req.body);
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
	asyncHandler(async (req, res) => {
		await acceptInviteSchema.validateAsync(req.body);
		await UsersService.acceptInvite(req.body.token, req.body.password);
		res.end();
	})
);

export default router;
