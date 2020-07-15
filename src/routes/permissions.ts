import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as PermissionsService from '../services/permissions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.use(useCollection('directus_permissions'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const primaryKey = await PermissionsService.createPermission(req.body, {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		const item = await PermissionsService.readPermission(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});

		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const item = await PermissionsService.readPermissions(req.sanitizedQuery, {
			role: req.role,
		});
		return res.json({ data: item || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await PermissionsService.readPermission(
			Number(req.params.pk),
			req.sanitizedQuery,
			{ role: req.role }
		);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const primaryKey = await PermissionsService.updatePermission(
			Number(req.params.pk),
			req.body,
			{
				role: req.role,
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			}
		);

		const item = await PermissionsService.readPermission(primaryKey, req.sanitizedQuery, {
			role: req.role,
		});

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await PermissionsService.deletePermission(Number(req.params.pk), {
			role: req.role,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		return res.status(200).end();
	})
);

export default router;
