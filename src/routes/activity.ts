import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as ActivityService from '../services/activity';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_activity'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await ActivityService.readActivities(req.sanitizedQuery);
		return res.json({
			data: records || null,
		});
	})
);

router.get(
	'/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await ActivityService.readActivity(req.params.pk, req.sanitizedQuery);

		return res.json({
			data: record || null,
		});
	})
);

export default router;
