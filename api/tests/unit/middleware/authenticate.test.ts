import { NextFunction, Request, Response } from 'express';
import authenticate from '../../../src/middleware/authenticate';
import '../../../src/types/express.d.ts';

describe('Middleware / Extract Token', () => {
	let mockRequest: Partial<Request & { token?: string }>;
	let mockResponse: Partial<Response>;
	const nextFunction: NextFunction = jest.fn();

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {};
		jest.clearAllMocks();
	});

	test('Authenticate', () => {});
});
