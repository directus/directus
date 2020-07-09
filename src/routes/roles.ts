import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as RolesService from '../services/roles';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RolesService.createRole(req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RolesService.readRole(primaryKey, req.sanitizedQuery);
		return res.json({ data: item });
	})
);

router.get(
	'/',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await RolesService.readRoles(req.sanitizedQuery);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await RolesService.readRole(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const primaryKey = await RolesService.updateRole(req.params.pk, req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		const item = await RolesService.readRole(primaryKey, req.sanitizedQuery);
		return res.json({ data: item });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_roles'),
	asyncHandler(async (req, res) => {
		await RolesService.deleteRole(req.params.pk, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
