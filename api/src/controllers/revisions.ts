import express from 'express';
import asyncHandler from 'express-async-handler';
import RevisionsService from '../services/revisions';
import MetaService from '../services/meta';

const router = express.Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_revisions', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	})
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const pk = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const record = await service.readByKey(pk as any, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	})
);

export default router;
