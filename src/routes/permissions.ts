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
		const primaryKey = await PermissionsService.createPermission(req.body, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await PermissionsService.readPermission(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const item = await PermissionsService.readPermissions(req.sanitizedQuery);
		return res.json({ data: item || null });
	})
);

router.get(
	'/:pk',
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await PermissionsService.readPermission(
			Number(req.params.pk),
			req.sanitizedQuery
		);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		const primaryKey = await PermissionsService.updatePermission(
			Number(req.params.pk),
			req.body,
			{
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			}
		);

		const item = await PermissionsService.readPermission(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		await PermissionsService.deletePermission(Number(req.params.pk), {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
