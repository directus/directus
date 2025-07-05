import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { Router } from 'express';
import { useMetrics } from '../metrics/index.js';
import asyncHandler from '../utils/async-handler.js';

const env = useEnv();
const router = Router();
const metrics = useMetrics();

router.get(
	'/',
	asyncHandler(async (req, _res, next) => {
		if (req.accountability?.admin === true) {
			return next();
		}

		// support Bearer Token of type `Metrics`
		const metricTokens = env['METRICS_TOKENS'] as string[] | undefined;

		if (!req.headers || !req.headers.authorization || !metricTokens) {
			throw new ForbiddenError({
				reason: `Missing authorization header or missing METRICS_TOKENS env variable`,
			});
		}

		const parts = req.headers.authorization.split(' ');

		if (parts.length !== 2 || parts[0]!.toLowerCase() !== 'metrics') {
			throw new ForbiddenError({
				reason: `Invalid authorization header`,
				values: {
					header: req.headers.authorization,
				},
			});
		}

		if (metricTokens.find((mt) => mt.toString() === parts[1]) !== undefined) {
			return next();
		}

		throw new ForbiddenError({
			reason: `Invalid metrics authorization token`,
			values: {
				header: req.headers.authorization,
			},
		});
	}),
	asyncHandler(async (_req, res) => {
		res.set('Content-Type', 'text/plain');
		// Don't cache anything by default
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Vary', 'Origin, Cache-Control');

		return res.send(await metrics?.readAll());
	}),
);

export default router;
