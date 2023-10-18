import { isDirectusError } from '@directus/errors';
import { toArray } from '@directus/utils';
import type { ErrorRequestHandler } from 'express';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import env from '../env.js';
import { ErrorCode, MethodNotAllowedError } from '@directus/errors';
import logger from '../logger.js';

// Note: keep all 4 parameters here. That's how Express recognizes it's the error handler, even if
// we don't use next
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	let payload: any = {
		errors: [],
	};

	const errors = toArray(err);

	let status: number | null = null;

	for (const err of errors) {
		if (env['NODE_ENV'] === 'development') {
			err.extensions = {
				...(err.extensions || {}),
				stack: err.stack,
			};
		}

		if (isDirectusError(err)) {
			logger.debug(err);

			if (!status) {
				status = err.status;
			} else if (status !== err.status) {
				status = 500;
			}

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

			status = 500;

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

	res.status(status ?? 500);

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
