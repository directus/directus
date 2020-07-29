import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import useCollection from '../middleware/use-collection';
import RevisionsService from '../services/revisions';

const router = express.Router();

router.use(useCollection('directus_revisions'));

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const records = await service.readByQuery(req.sanitizedQuery);
		return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new RevisionsService({ accountability: req.accountability });
		const record = await service.readByKey(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

export default router;
