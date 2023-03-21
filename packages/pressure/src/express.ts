import type { RequestHandler } from 'express';
import { PressureMonitor } from './monitor.js';
import type { PressureMonitorOptions } from './monitor.js';

export const handlePressure = (options: PressureMonitorOptions): RequestHandler => {
	const monitor = new PressureMonitor(options);

	return (_req, _res, next) => {
		if (monitor.overloaded) {
			return next(new Error('NO'));
		}

		return next();
	};
};
