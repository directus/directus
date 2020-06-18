import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import { readActivities, readActivity } from '../services/activity';

const router = express.Router();

router.get(
	'/',
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
