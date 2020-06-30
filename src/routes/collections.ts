import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as CollectionsService from '../services/collections';

const router = Router();

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const data = await CollectionsService.readAll(req.sanitizedQuery);
		res.json({ data });
	})
);

export default router;
