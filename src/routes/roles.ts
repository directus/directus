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
	asyncHandler(async (req, res) => {
		const records = await RolesService.createRole(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await RolesService.readRoles(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_roles'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await RolesService.readRole(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_roles'),
	asyncHandler(async (req, res) => {
		const records = await RolesService.updateRole(req.params.pk, req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_roles'),
	asyncHandler(async (req, res) => {
		await RolesService.deleteRole(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
