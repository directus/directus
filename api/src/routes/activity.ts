import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import ActivityService from '../services/activity';
import MetaService from '../services/meta';
import { Action } from '../types';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({
			data: records || null,
			meta,
		});
	})
);

router.get(
	'/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

router.post(
	'/comment',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });

		const primaryKey = await service.create({
			...req.body,
			action: Action.COMMENT,
			action_by: req.accountability?.user,
			ip: req.ip,
			user_agent: req.get('user-agent'),
		});

		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

router.patch(
	'/comment/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

router.delete(
	'/comment/:pk',
	useCollection('directus_activity'),
	asyncHandler(async (req, res) => {
		const service = new ActivityService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return res.status(200).end();
	})
);

export default router;
