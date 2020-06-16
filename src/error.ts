import { ErrorRequestHandler } from 'express';

export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
}

enum HTTPStatus {
	NOT_FOUND = 404,
}

export const errorHandler: ErrorRequestHandler = (error: APIError, req, res, next) => {
	res.status(error.status);

	const response: any = {
		error: {
			code: error.code,
			message: error.message,
		},
	};

	if ((process.env.NODE_ENV = 'development')) {
		response.error.stack = error.stack;
	}

	res.json(response);
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
