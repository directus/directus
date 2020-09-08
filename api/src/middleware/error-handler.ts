import { ErrorRequestHandler } from 'express';
import { BaseException } from '../exceptions';
import logger from '../logger';
import env from '../env';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	let payload: any;

	if (err instanceof BaseException) {
		logger.debug(err);

		res.status(err.status);

		payload = {
			errors: [
				{
					message: err.message,
					extensions: {
						...err.extensions,
						code: err.code,
					},
				},
			],
		};
	} else {
		logger.error(err);

		res.status(500);

		payload = {
			errors: [
				{
					message: err.message,
					extensions: {
						code: 'INTERNAL_SERVER_ERROR',
					},
				},
			],
		};
	}

	if (env.NODE_ENV === 'development') {
		payload.errors[0].extensions.exception = {
			stack: err.stack,
		};
	}

	return res.json(payload);
};

export default errorHandler;
