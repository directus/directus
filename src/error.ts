import { ErrorRequestHandler } from 'express';
import { ValidationError } from '@hapi/joi';
import { TokenExpiredError } from 'jsonwebtoken';
import logger from './logger';

export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
	ENOENT = 'ENOENT',
	EXTENSION_ILLEGAL_TYPE = 'EXTENSION_ILLEGAL_TYPE',
	INVALID_QUERY = 'INVALID_QUERY',
	INVALID_USER_CREDENTIALS = 'INVALID_USER_CREDENTIALS',
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	FAILED_VALIDATION = 'FAILED_VALIDATION',
	MALFORMED_JSON = 'MALFORMED_JSON',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

enum HTTPStatus {
	NOT_FOUND = 404,
	FIELD_NOT_FOUND = 400,
	INTERNAL_SERVER_ERROR = 500,
	ENOENT = 501,
	EXTENSION_ILLEGAL_TYPE = 400,
	INVALID_QUERY = 400,
	INVALID_USER_CREDENTIALS = 401,
	USER_NOT_FOUND = 401,
	FAILED_VALIDATION = 422,
	MALFORMED_JSON = 400,
	TOKEN_EXPIRED = 401,
}

export const errorHandler: ErrorRequestHandler = (
	error: APIError | ValidationError | Error,
	req,
	res,
	next
) => {
	let response: any = {};

	if (error instanceof APIError) {
		logger.debug(error);

		res.status(error.status);

		response = {
			error: {
				code: error.code,
				message: error.message,
			},
		};
	} else if (error instanceof ValidationError) {
		logger.debug(error);

		res.status(HTTPStatus.FAILED_VALIDATION);

		response = {
			error: {
				code: ErrorCode.FAILED_VALIDATION,
				message: error.message,
			},
		};
	} else if (error instanceof TokenExpiredError) {
		logger.debug(error);
		res.status(HTTPStatus.TOKEN_EXPIRED);
		response = {
			error: {
				code: ErrorCode.TOKEN_EXPIRED,
				message: 'The provided token is expired.',
			},
		};
	}

	// Syntax errors are most likely thrown by Body Parser when misaligned JSON is sent to the API
	else if (error instanceof SyntaxError && 'entity.parse.failed') {
		logger.debug(error);

		res.status(HTTPStatus.MALFORMED_JSON);

		response = {
			error: {
				code: ErrorCode.MALFORMED_JSON,
				message: error.message,
			},
		};
	} else {
		logger.error(error);

		res.status(500);

		response = {
			error: {
				code: ErrorCode.INTERNAL_SERVER_ERROR,
			},
		};

		if (process.env.NODE_ENV === 'development') {
			response.error.message = error.message;
		}
	}

	if (process.env.NODE_ENV === 'development') {
		response.error.stack = error.stack;
	}

	return res.json(response);
};

export default class APIError extends Error {
	status: HTTPStatus;
	code: ErrorCode;

	constructor(code: ErrorCode, message: string) {
		super(message);
		this.status = HTTPStatus[code] || 500;
		this.code = code;

		Error.captureStackTrace(this, this.constructor);
	}
}
