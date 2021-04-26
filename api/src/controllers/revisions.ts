import express from 'express';
import asyncHandler from '../utils/async-handler';
import { RevisionsService, MetaService } from '../services';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { validateBatch } from '../middleware/validate-batch';

const router = express.Router();

router.use(useCollection('directus_revisions'));

const readHandler = asyncHandler(async (req, res, next) => {
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
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params.pk, req.sanitizedQuery);

		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

export default router;
