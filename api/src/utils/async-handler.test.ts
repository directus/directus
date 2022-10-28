import type { RequestHandler, NextFunction, Request, Response } from 'express';
import '../../src/types/express.d.ts';
import asyncHandler from './async-handler';
import { expect, vi, test } from 'vitest';

let mockRequest: Partial<Request & { token?: string }>;
let mockResponse: Partial<Response>;
const nextFunction: NextFunction = vi.fn();

test('Wraps async middleware in Promise resolve that will catch rejects and pass them to the nextFn', async () => {
	const err = new Error('testing');

	const middleware: RequestHandler = async (_req, _res, _next) => {
		throw err;
	};

	await asyncHandler(middleware)(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);

	expect(nextFunction).toHaveBeenCalledWith(err);
});
