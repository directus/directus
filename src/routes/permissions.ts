import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as PermissionsService from '../services/permissions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		const records = await PermissionsService.createPermission(req.body, res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/',
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await PermissionsService.readPermissions(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await PermissionsService.readPermission(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		const records = await PermissionsService.updatePermission(
			req.params.pk,
			req.body,
			res.locals.query
		);
		return res.json({ data: records });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		await PermissionsService.deletePermission(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
