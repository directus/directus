import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import WebhooksService from '../services/webhooks';
import useCollection from '../middleware/use-collection';
import MetaService from '../services/meta';

const router = express.Router();

router.use(useCollection('directus_webhooks'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({ data: records || null, meta });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);

		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new WebhooksService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, req.params.pk);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new WebhooksService({ accountability: req.accountability });
		await service.delete(req.params.pk);

		return res.status(200).end();
	})
);

export default router;
