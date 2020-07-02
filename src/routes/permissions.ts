import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as PermissionsService from '../services/permissions';
import * as ActivityService from '../services/activity';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.post(
	'/',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		const item = await PermissionsService.createPermission(req.body, req.sanitizedQuery);

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
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const item = await PermissionsService.readPermissions(req.sanitizedQuery);
		return res.json({ data: item });
	})
);

router.get(
	'/:pk',
	useCollection('directus_permissions'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await PermissionsService.readPermission(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		const item = await PermissionsService.updatePermission(
			req.params.pk,
			req.body,
			req.sanitizedQuery
		);

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
	useCollection('directus_permissions'),
	asyncHandler(async (req, res) => {
		await PermissionsService.deletePermission(req.params.pk);

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

export default router;
