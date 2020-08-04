import { ErrorRequestHandler } from 'express';
import { BaseException } from '../exceptions';
import logger from '../logger';
import env from '../env';

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

		if (env.NODE_ENV === 'development') {
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

		if (env.NODE_ENV === 'development') {
			payload.error.stack = err.stack;
		}

		return res.json(payload);
	}
};

export default errorHandler;
