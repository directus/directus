import type { Request, RequestHandler, Response } from 'express';
import { expect, test, vi } from 'vitest';
import asyncHandler from './async-handler.js';

let mockRequest: Request;
let mockResponse: Response;
const nextFunction = vi.fn();

test('Wraps async middleware in Promise resolve that will catch rejects and pass them to the nextFn', async () => {
	const error = new Error('testing');

	const middleware: RequestHandler = async (_req, _res, _next) => {
		throw error;
	};

	await asyncHandler(middleware)(mockRequest, mockResponse, nextFunction);

	expect(nextFunction).toHaveBeenCalledWith(error);
});
