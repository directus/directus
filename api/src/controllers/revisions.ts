import express from 'express';
import { respond } from '../middleware/respond';
import useCollection from '../middleware/use-collection';
import { validateBatch } from '../middleware/validate-batch';
import { MetaService, RevisionsService } from '../services';
import asyncHandler from '../utils/async-handler';
import { loadUserRoleServices } from '../middleware/load-user-role-services';

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

router.get('/', loadUserRoleServices, validateBatch('read'), readHandler, respond);
router.search('/', loadUserRoleServices, validateBatch('read'), readHandler, respond);

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
