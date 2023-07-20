import { isDirectusError } from '@directus/errors';
import { toArray } from '@directus/utils';
import type { ErrorRequestHandler } from 'express';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import env from '../env.js';
import { ErrorCode, MethodNotAllowedError } from '../errors/index.js';
import logger from '../logger.js';

// Note: keep all 4 parameters here. That's how Express recognizes it's the error handler, even if
// we don't use next
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	let payload: any = {
		errors: [],
	};

	const errors = toArray(err);

	if (!errors.length) {
		res.status(500);
	}

	for (const err of errors) {
		if (env['NODE_ENV'] === 'development') {
			err.extensions = {
				...(err.extensions || {}),
				stack: err.stack,
			};
		}

		if (isDirectusError(err)) {
			logger.debug(err);

			res.status(err.status);

			payload.errors.push({
				message: err.message,
				extensions: {
					code: err.code,
					...(err.extensions ?? {}),
				},
			});

			if (isDirectusError(err, ErrorCode.MethodNotAllowed)) {
				res.header('Allow', (err as InstanceType<typeof MethodNotAllowedError>).extensions.allowed.join(', '));
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
		.then((updatedErrors) => {
			return res.json({ ...payload, errors: updatedErrors });
		});
};

export default errorHandler;
