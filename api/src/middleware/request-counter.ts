import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../license/index.js';
import { useLogger } from '../logger/index.js';
import { useBufferedCounter } from '../telemetry/counter/use-buffered-counter.js';
import { TRACKED_METHODS } from '../telemetry/utils/format-api-request-counts.js';

const TRACKED_METHODS_UPPER = new Set(TRACKED_METHODS.map((m) => m.toUpperCase()));

const env = useEnv();

const requestCounterMiddleware: RequestHandler = (req, _res, next) => {
	if (!getEntitlementManager().isEntitled('telemetry_required') && toBoolean(env['TELEMETRY']) === false) {
		return next();
	}

	if (TRACKED_METHODS_UPPER.has(req.method)) {
		try {
			const counter = useBufferedCounter('api-requests');
			counter.increment(req.method.toLowerCase());
		} catch (err) {
			const logger = useLogger();
			logger.trace(err, 'Failed to increment request counter');
		}
	}

	next();
};

export default requestCounterMiddleware;
