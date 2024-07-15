import { ErrorCode, MethodNotAllowedError, isDirectusError } from '@directus/errors';
import { isObject, toArray } from '@directus/utils';
import { getNodeEnv } from '@directus/utils/node';
import type { ErrorRequestHandler } from 'express';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';

// Note: keep all 4 parameters here. That's how Express recognizes it's the error handler, even if
// we don't use next
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	const logger = useLogger();

	let payload: any = {
		errors: [],
	};

	const errors = toArray<unknown>(err);

	let status: number | null = null;

	for (const error of errors) {
		if (getNodeEnv() === 'development') {
			if (isObject(error)) {
				error['extensions'] = {
					...(error['extensions'] || {}),
					stack: error['stack'],
				};
			}
		}

		if (isDirectusError(error)) {
			logger.debug(error);

			if (!status) {
				status = error.status;
			} else if (status !== error.status) {
				status = 500;
			}

			payload.errors.push({
				message: error.message,
				extensions: {
					code: error.code,
					...(error.extensions ?? {}),
				},
			});

			if (isDirectusError(error, ErrorCode.MethodNotAllowed)) {
				res.header('Allow', (error as InstanceType<typeof MethodNotAllowedError>).extensions.allowed.join(', '));
			}
		} else {
			logger.error(error);

			status = 500;

			if (req.accountability?.admin === true) {
				const localError = isObject(error) ? error : {};
				const message = localError['message'] ?? typeof error === 'string' ? error : null;

				payload = {
					errors: [
						{
							message: message || 'An unexpected error occurred.',
							extensions: {
								code: 'INTERNAL_SERVER_ERROR',
								...(localError['extensions'] ?? {}),
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
			},
		)
		.then((updatedErrors) => {
			return res.json({ ...payload, errors: updatedErrors });
		});
};

export default errorHandler;
