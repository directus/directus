import express from 'express';
import asyncHandler from '../utils/async-handler';
import { RevisionsService, MetaService } from '../services';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';

const router = express.Router();

router.use(useCollection('directus_revisions'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_revisions', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(pk as any, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

export default router;
