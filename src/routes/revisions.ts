import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as RevisionsService from '../services/revisions';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_revisions'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		// const records = await RevisionsService.readRevisions(req.sanitizedQuery);
		// return res.json({ data: records || null });
	})
);

router.get(
	'/:pk',
	useCollection('directus_revisions'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const record = await RevisionsService.readRevision(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

export default router;
