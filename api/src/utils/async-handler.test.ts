import type { Request, RequestHandler, Response } from 'express';
import '../types/express.d.ts';
import asyncHandler from './async-handler.js';
import { expect, test, vi } from 'vitest';

const mockRequest: Partial<Request & { token?: string }> = {};
const mockResponse: Partial<Response> = {};
const nextFunction = vi.fn();

test('Wraps async middleware in Promise resolve that will catch rejects and pass them to the nextFn', async () => {
	const err = new Error('testing');

	const middleware: RequestHandler = async (_req, _res, _next) => {
		throw err;
	};

	await asyncHandler(middleware)(mockRequest as Request, mockResponse as Response, nextFunction);

	expect(nextFunction).toHaveBeenCalledWith(err);
});
