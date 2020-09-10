import express from 'express';
import asyncHandler from 'express-async-handler';
import WebhooksService from '../services/webhooks';
import MetaService from '../services/meta';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = { data: item || null };
		return next();
	})
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	})
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		res.locals.payload = { data: item || null };
		return next();
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return next();
	})
);

export default router;
