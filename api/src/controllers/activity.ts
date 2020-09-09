import express from 'express';
import asyncHandler from 'express-async-handler';
import ActivityService from '../services/activity';
import MetaService from '../services/meta';
import { Action } from '../types';

const router = express.Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_activity', req.sanitizedQuery);

		res.locals.payload = {
			data: records || null,
			meta,
		};

		return next();
	}),
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		res.locals.payload = {
			data: record || null,
		};

		return next();
	}),
);

router.post(
	'/comment',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });

		const primaryKey = await service.create({
			...req.body,
			action: Action.COMMENT,
			action_by: req.accountability?.user,
			ip: req.ip,
			user_agent: req.get('user-agent'),
		});

		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = {
			data: record || null,
		};

		return next();
	}),
);

router.patch(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const record = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = {
			data: record || null,
		};

		return next();
	}),
);

router.delete(
	'/comment/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return next();
	}),
);

export default router;
