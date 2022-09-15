import type { RequestHandler, NextFunction, Request, Response } from 'express';
import { test, expect, vi} from 'vitest'
import '../../src/types/express.d.ts';
import asyncHandler from './async-handler.js';

let mockRequest: Partial<Request & { token?: string }>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn<any[], NextFunction>();

test('Wraps async middleware in Promise resolve that will catch rejects and pass them to the nextFn', async () => {
	const err = new Error('testing');

	const middleware: RequestHandler = async (_req, _res, _next) => {
		throw err;
	};

	await asyncHandler(middleware)(mockRequest as Request, mockResponse as Response, nextFunction as NextFunction);

	expect(nextFunction).toHaveBeenCalledWith(err);
});
