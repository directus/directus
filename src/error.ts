import { ErrorRequestHandler } from 'express';
import logger from './logger';

export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

enum HTTPStatus {
	NOT_FOUND = 404,
	FIELD_NOT_FOUND = 400,
	INTERNAL_SERVER_ERROR = 500,
}

export const errorHandler: ErrorRequestHandler = (error: APIError | Error, req, res, next) => {
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
	} else {
		logger.error(error);

		res.status(500);

		response = {
			error: {
				code: ErrorCode.INTERNAL_SERVER_ERROR,
			},
		};

		if ((process.env.NODE_ENV = 'development')) {
			response.error.message = error.message;
		}
	}

	if ((process.env.NODE_ENV = 'development')) {
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
