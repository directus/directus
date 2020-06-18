import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as RevisionsService from '../services/revisions';

const router = express.Router();

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await RevisionsService.readRevisions(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await RevisionsService.readRevision(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

export default router;
