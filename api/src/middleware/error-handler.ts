import { ErrorRequestHandler } from 'express';
import emitter from '../emitter';
import env from '../env';
import { MethodNotAllowedException } from '../exceptions';
import { BaseException } from '@directus/shared/exceptions';
import logger from '../logger';
import { toArray } from '@directus/shared/utils';
import getDatabase from '../database';

// Note: keep all 4 parameters here. That's how Express recognizes it's the error handler, even if
// we don't use next
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
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
					code: err.code,
					...err.extensions,
				},
			});

			if (err instanceof MethodNotAllowedException) {
				res.header('Allow', err.extensions.allow.join(', '));
			}
		} else {
			logger.error(err);

			res.status(500);

			if (req.accountability?.admin === true) {
				payload = {
					errors: [
						{
							message: err.message,
							extensions: {
								code: 'INTERNAL_SERVER_ERROR',
								...err.extensions,
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

	emitter
		.emitFilter(
			'request.error',
			payload.errors,
			{},
			{
				database: getDatabase(),
				schema: req.schema,
				accountability: req.accountability ?? null,
			}
		)
		.then(() => {
			return res.json(payload);
		});
};

export default errorHandler;
