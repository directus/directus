import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import { readActivities, readActivity } from '../services/activity';
import useCollection from '../middleware/use-collection';

const router = express.Router();

router.get(
	'/',
	useCollection('directus_activity'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await readActivities(res.locals.query);
		return res.json({
			data: records,
		});
	})
);

router.get(
	'/:pk',
	useCollection('directus_activity'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await readActivity(req.params.pk, res.locals.query);

		return res.json({
			data: record,
		});
	})
);

export default router;
