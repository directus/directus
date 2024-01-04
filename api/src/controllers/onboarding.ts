import { ForbiddenError, InvalidCredentialsError } from '@directus/errors';
import express from 'express';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';
import { collectOnboarding } from '../utils/onboarding.js';

const router = express.Router();

router.post(
	'/:pk/send',
	asyncHandler(async (req, _res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsError();
		}

		if (!req.accountability.admin || !req.params['pk']) {
			throw new ForbiddenError();
		}

		await collectOnboarding(req.params['pk']);

		return next();
	}),
	respond,
);

export default router;
