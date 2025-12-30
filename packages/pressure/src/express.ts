import type { PressureMonitorOptions } from './monitor.js';
import { PressureMonitor } from './monitor.js';
import type { RequestHandler } from 'express';

export const handlePressure = (
	options: PressureMonitorOptions & { error?: Error; retryAfter?: string },
): RequestHandler => {
	const monitor = new PressureMonitor(options);

	return (_req, res, next) => {
		if (monitor.overloaded) {
			if (options.retryAfter) {
				res.header('Retry-After', options.retryAfter);
			}

			return next(options?.error ?? new Error('Pressure limit exceeded'));
		}

		return next();
	};
};
