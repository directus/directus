import { ErrorCode, isDirectusError } from '@directus/errors';
import { isObject } from '@directus/utils';
import { getNodeEnv } from '@directus/utils/node';
import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger.js';

type ApiError = {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
};

const FALLBACK_ERROR = {
	status: 500,
	message: 'An unexpected error occurred.',
	extensions: {
		code: 'INTERNAL_SERVER_ERROR',
	},
};

export const errorHandler = asyncErrorHandler(async (err, req, res) => {
	const logger = useLogger();

	let errors: ApiError[] = [];
	let status: number | null = null;

	// It can be assumed that at least one error is given
	const receivedErrors: unknown[] = Array.isArray(err) ? err : [err];

	for (const error of receivedErrors) {
		if (getNodeEnv() === 'development') {
			// If available, expose stack trace under error's extensions data
			if (isObject(error) && error['stack'] && (error['extensions'] === undefined || isObject(error['extensions']))) {
				error['extensions'] = {
					...error['extensions'],
					stack: error['stack'],
				};
			}
		}

		if (isDirectusError(error)) {
			logger.debug(error);

			if (status === null) {
				// Use current error status as response status
				status = error.status;
			} else if (status !== error.status) {
				// Fallback if status has already been set by a preceding error
				// and doesn't match the current one
				status = FALLBACK_ERROR.status;
			}

			errors.push({
				message: error.message,
				extensions: {
					// Expose error code under error's extensions data
					code: error.code,
					...(error.extensions ?? {}),
				},
			});

			if (isDirectusError(error, ErrorCode.MethodNotAllowed)) {
				res.header('Allow', error.extensions.allowed.join(', '));
			}
		} else {
			logger.error(error);

			status = FALLBACK_ERROR.status;

			if (req.accountability?.admin === true) {
				const localError = isObject(error) ? error : {};

				// Use 'message' prop if available, otherwise if 'error' is a string use that
				const message =
					(typeof localError['message'] === 'string' ? localError['message'] : null) ??
					(typeof error === 'string' ? error : null);

				errors = [
					{
						message: message || FALLBACK_ERROR.message,
						extensions: {
							code: FALLBACK_ERROR.extensions.code,
							...(localError['extensions'] ?? {}),
						},
					},
				];
			} else {
				// Don't expose unknown errors to non-admin users
				errors = [FALLBACK_ERROR];
			}
		}
	}

	res.status(status ?? FALLBACK_ERROR.status);

	const updatedErrors = await emitter.emitFilter(
		'request.error',
		errors,
		{},
		{
			database: getDatabase(),
			schema: req.schema,
			accountability: req.accountability ?? null,
		},
	);

	return res.json({ errors: updatedErrors });
});

function asyncErrorHandler(fn: ErrorRequestHandler) {
	return (err: any, req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(fn(err, req, res, next)).catch((error) => {
			// To be on the safe side and ensure the response call is reached in any case
			try {
				const logger = useLogger();
				logger.error(error, 'Unexpected error in error handler');
			} catch {
				// Ignore
			}

			res.status(FALLBACK_ERROR.status);
			return res.json({ errors: [FALLBACK_ERROR] });
		});
}
