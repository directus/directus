import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { RequestHandler } from 'express';
import { useLogger } from '../logger/index.js';
import { useBufferedCounter } from '../telemetry/counter/use-buffered-counter.js';
import { TRACKED_METHODS } from '../telemetry/utils/format-api-request-counts.js';

const TRACKED_METHODS_UPPER = new Set(TRACKED_METHODS.map((m) => m.toUpperCase()));

let requestCounterMiddleware: RequestHandler = (_req, _res, next) => next();

const env = useEnv();

if (toBoolean(env['TELEMETRY'])) {
	requestCounterMiddleware = (req, _res, next) => {
		if (TRACKED_METHODS_UPPER.has(req.method)) {
			const logger = useLogger();

			try {
				const counter = useBufferedCounter('api-requests');
				counter.increment(req.method.toLowerCase());
			} catch (err) {
				logger.trace(err, 'Failed to increment request counter');
			}
		}

		next();
	};
}

export default requestCounterMiddleware;
