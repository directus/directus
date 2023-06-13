import type { RequestHandler } from 'express';
import type { PressureMonitorOptions } from './monitor.js';
import { PressureMonitor } from './monitor.js';

export const handlePressure = (
	options: PressureMonitorOptions & { error?: Error; retryAfter?: string }
): RequestHandler => {
	const monitor = new PressureMonitor(options);

	return (_req, res, next) => {
		const { healthy, triggered } = monitor.overloaded;

		if (healthy === false) {
			if (options.retryAfter) {
				res.header('Retry-After', options.retryAfter);
			}

			let message = 'Pressure limit exceeded:';

			for (const { type, current, limit } of triggered) {
				message += ` "${type}" of ${current} is higher than limit ${limit}.`;
			}

			return next(options?.error ?? new Error(message));
		}

		return next();
	};
};
