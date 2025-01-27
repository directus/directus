import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { Router } from 'express';
import { useMetrics } from '../metrics/index.js';
import asyncHandler from '../utils/async-handler.js';

const env = useEnv();
const metrics = useMetrics();
const router = Router();

const checkAccess = asyncHandler(async (req, _res, next) => {
	const token = req.headers.authorization;
	const metricTokens = env['METRICS_TOKENS'] as string[] | undefined;

	if (req.accountability?.admin === true) {
		return next();
	}

	if (!token || !metricTokens?.find((metricToken) => metricToken.toString() === token)) {
		throw new ForbiddenError();
	}

	return next();
});

router.get(
	'/',
	checkAccess,
	asyncHandler(async (_req, res) => {
		res.set('Content-Type', 'text/plain');
		// Don't cache anything by default
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Vary', 'Origin, Cache-Control');

		return res.send(await metrics.readAll());
	}),
);

export default router;
