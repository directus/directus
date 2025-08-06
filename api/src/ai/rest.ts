import express from 'express';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

router.get(
	'/',
	asyncHandler(async (_req, res, next) => {
		res.locals['payload'] = {
			data: 'AI',
		};

		return next();
	}),
	respond,
);

export default router;
