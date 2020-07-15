import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as RolesService from '../services/roles';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_roles'));

router.post(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RolesService.createRole(req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RolesService.readRole(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const records = await RolesService.readRoles(req.sanitizedQuery, { role: req.role });
		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await RolesService.readRole(req.params.pk, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RolesService.updateRole(req.params.pk, req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RolesService.readRole(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await RolesService.deleteRole(req.params.pk, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
