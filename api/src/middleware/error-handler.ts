import { ErrorRequestHandler } from 'express';
import { BaseException } from '../exceptions';
import logger from '../logger';
import env from '../env';
import { toArray } from '../utils/to-array';
import { emitAsyncSafe } from '../emitter';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	let payload: any = {
		errors: [],
	};

	const errors = toArray(err);

	if (errors.some((err) => err instanceof BaseException === false)) {
		res.status(500);
	} else {
		let status = errors[0].status;

		for (const err of errors) {
			if (status !== err.status) {
				// If there's multiple different status codes in the errors, use 500
				status = 500;
				break;
			}
		}

		res.status(status);
	}

	for (const err of errors) {
		if (env.NODE_ENV === 'development') {
			err.extensions = {
				...(err.extensions || {}),
				stack: err.stack,
			};
		}

		if (err instanceof BaseException) {
			logger.debug(err);

			res.status(err.status);

			payload.errors.push({
				message: err.message,
				extensions: {
					...err.extensions,
					code: err.code,
				},
			});
		} else {
			logger.error(err);

			res.status(500);

			if (req.accountability?.admin === true) {
				payload = {
					errors: [
						{
							message: err.message,
							extensions: {
								...err.extensions,
								code: 'INTERNAL_SERVER_ERROR',
							},
						},
					],
				};
			} else {
				payload = {
					errors: [
						{
							message: 'An unexpected error occurred.',
							extensions: {
								code: 'INTERNAL_SERVER_ERROR',
							},
						},
					],
				};
			}
		}
	}

	emitAsyncSafe('error', payload.errors).then(() => {
		return res.json(payload);
	});
};

export default errorHandler;
