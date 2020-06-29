import { ErrorRequestHandler } from 'express';
import { BaseException } from '../exceptions';
import logger from '../logger';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	if (err instanceof BaseException) {
		logger.debug(err);

		res.status(err.status);

		const payload: any = {
			error: {
				code: err.code,
				message: err.message,
			},
		};

		if (process.env.NODE_ENV === 'development') {
			payload.error.stack = err.stack;
		}

		return res.json(payload);
	} else {
		logger.error(err);

		res.status(500);

		const payload: any = {
			error: {
				code: 'INTERNAL_SERVER_ERROR',
				message: err.message,
			},
		};

		if (process.env.NODE_ENV === 'development') {
			payload.error.stack = err.stack;
		}

		return res.json(payload);
	}
};

export default errorHandler;
