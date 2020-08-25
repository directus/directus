import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import RevisionsService from '../services/revisions';
import MetaService from '../services/meta';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_revisions'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({ data: records || null, meta });
	})
);

router.get(
	'/:pk',
	useCollection('directus_revisions'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

export default router;
