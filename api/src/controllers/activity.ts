import express from 'express';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { ActivityService } from '../services/activity.js';
import { MetaService } from '../services/meta.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.use(useCollection('directus_activity'));

const readHandler = asyncHandler(async (req, res, next) => {
	const service = new ActivityService({
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let result;

	if (req.singleton) {
		result = await service.readSingleton(req.sanitizedQuery);
	} else if (req.body.keys) {
		result = await service.readMany(req.body.keys, req.sanitizedQuery);
	} else {
		result = await service.readByQuery(req.sanitizedQuery);
	}

	const meta = await metaService.getMetaForQuery('directus_activity', req.sanitizedQuery);

	res.locals['payload'] = {
		data: result,
		meta,
	};

	return next();
});

router.search('/', validateBatch('read'), readHandler, respond);
router.get('/', readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new ActivityService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);

		res.locals['payload'] = {
			data: record || null,
		};

		return next();
	}),
	respond,
);

export default router;
