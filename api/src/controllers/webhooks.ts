import { ErrorCode, createError } from '@directus/errors';
import express from 'express';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { MetaService } from '../services/meta.js';
import { WebhooksService } from '../services/webhooks.js';
import asyncHandler from '../utils/async-handler.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = express.Router();

router.use(useCollection('directus_webhooks'));

router.post(
	'/',
	asyncHandler(async (_req, _res, _next) => {
		// Disallow creation of new Webhooks as part of the deprecation, see https://github.com/directus/directus/issues/15553
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}),
	respond,
);

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new WebhooksService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const records = await service.readByQuery(req.sanitizedQuery);
	const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

	res.locals['payload'] = { data: records || null, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new WebhooksService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = { data: record || null };
		return next();
	}),
	respond,
);

router.patch(
	'/',
	validateBatch('update'),
	asyncHandler(async (_req, _res, _next) => {
		// Disallow patching of Webhooks as part of the deprecation, see https://github.com/directus/directus/issues/15553
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}),
	respond,
);

router.patch(
	'/:pk',
	asyncHandler(async (_req, _res, _next) => {
		// Disallow patching of Webhooks as part of the deprecation, see https://github.com/directus/directus/issues/15553
		throw new (createError(ErrorCode.MethodNotAllowed, 'Webhooks are deprecated, use Flows instead', 405))();
	}),
	respond,
);

router.delete(
	'/',
	asyncHandler(async (req, _res, next) => {
		const service = new WebhooksService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			await service.deleteByQuery(sanitizedQuery);
		}

		return next();
	}),
	respond,
);

router.delete(
	'/:pk',
	asyncHandler(async (req, _res, next) => {
		const service = new WebhooksService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['pk']!);

		return next();
	}),
	respond,
);

export default router;
