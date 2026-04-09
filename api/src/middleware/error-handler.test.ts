import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { useEnv } from '@directus/env';
import {
	createError,
	ErrorCode,
	InvalidCredentialsError,
	InvalidTokenError,
	TokenExpiredError,
} from '@directus/errors';
import type { Accountability } from '@directus/types';
import axios, { AxiosError } from 'axios';
import type { Request, RequestHandler, Response } from 'express';
import express from 'express';
import type { Logger } from 'pino';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { expectMcpBearerChallenge } from '../test-utils/mcp-oauth.js';
import * as errorHandlerMod from './error-handler.js';

vi.mock('../database/index');
vi.mock('../logger/index');

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

let mockRequest: Request;
let mockResponse: Response;
const nextFunction = vi.fn();
let mockLogger: Logger;

beforeEach(() => {
	mockRequest = {} as Request;

	mockResponse = {
		status: vi.fn(),
		json: vi.fn(),
	} as unknown as Response;

	mockLogger = {
		error: vi.fn(),
		debug: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

const FALLBACK_ERROR = {
	extensions: {
		code: 'INTERNAL_SERVER_ERROR',
	},
	message: 'An unexpected error occurred.',
};

const FALLBACK_STATUS = 500;

describe('Error handler behaves correctly in express app', () => {
	const startApp = (routeHandler: RequestHandler) =>
		new Promise<number>((resolve, reject) => {
			const app = express();

			const server = http.createServer(app);
			server.on('error', (error) => reject(error));

			app.get('/', (req, res, next) => {
				server.close();
				routeHandler(req, res, next);
			});

			app.use(errorHandlerMod.errorHandler);

			server.listen(() => {
				const { port } = server.address() as AddressInfo;
				resolve(port);
			});
		});

	const error = new (createError('NOT_FOUND', `Rabbit not found`, 404))();

	test('Handler is called in case of express route error', async () => {
		const spy = vi.spyOn(errorHandlerMod, 'errorHandler');

		const port = await startApp(() => {
			// Error in route
			throw error;
		});

		expect.assertions(2);

		try {
			await axios(`http://0:${port}`);
		} catch (axiosError) {
			expect((axiosError as AxiosError).response?.data).toMatchObject({
				errors: [
					{
						extensions: {
							code: error.code,
						},
						message: error.message,
					},
				],
			});
		}

		expect(spy.mock.calls[0]?.[0]).toBe(error);
	});

	test('Handler catches the case where headers have already been sent', async () => {
		const spy = vi.spyOn(errorHandlerMod, 'errorHandler');

		const response = { data: { carrots: 1000 } };

		const port = await startApp((_req, res) => {
			res.json(response);
			// Error after response has already be sent
			throw error;
		});

		const { data } = await axios(`http://0:${port}`);

		expect(data).toMatchObject(response);
		expect(spy.mock.calls[0]?.[0]).toBe(error);

		expect(mockLogger.error).toHaveBeenLastCalledWith(
			expect.objectContaining({
				message: 'Cannot set headers after they are sent to the client',
				code: 'ERR_HTTP_HEADERS_SENT',
			}),
			'Unexpected error in error handler',
		);
	});
});

describe('DirectusError', () => {
	const error1 = new (createError('IM_A_RABBIT', `I'm a rabbit`, 418))();
	const error2 = new (createError('OUT_OF_CARROTS', 'Temporarily out of carrots', 503))();

	test('Respond with data from single error', async () => {
		await errorHandlerMod.errorHandler(error1, mockRequest, mockResponse, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith({
			errors: [
				{
					extensions: {
						code: error1.code,
					},
					message: error1.message,
				},
			],
		});
	});

	test('Respond with data from multiple errors', async () => {
		await errorHandlerMod.errorHandler([error1, error2], mockRequest, mockResponse, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith({
			errors: [
				{
					extensions: {
						code: error1.code,
					},
					message: error1.message,
				},
				{
					extensions: {
						code: error2.code,
					},
					message: error2.message,
				},
			],
		});
	});

	test('Respond with fallback error if one of the errors is unknown', async () => {
		await errorHandlerMod.errorHandler([error1, new Error()], mockRequest, mockResponse, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith({
			errors: [FALLBACK_ERROR],
		});
	});

	test('Respond with status from error', async () => {
		await errorHandlerMod.errorHandler(error1, mockRequest, mockResponse, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(error1.status);
	});

	test('Respond with status from multiple errors if they match', async () => {
		await errorHandlerMod.errorHandler([error1, error1], mockRequest, mockResponse, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(error1.status);
	});

	test('Respond with fallback status if error statuses do not match', async () => {
		await errorHandlerMod.errorHandler([error1, error2], mockRequest, mockResponse, nextFunction);

		expect(mockResponse.status).toHaveBeenCalledWith(FALLBACK_STATUS);
	});
});

describe('Unknown errors', () => {
	const error = new Error('Lost in rabbit hole');

	test('Respond with data from error for admin users', async () => {
		mockRequest.accountability = { admin: true } as Accountability;

		await errorHandlerMod.errorHandler(error, mockRequest, mockResponse, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith({
			errors: [
				{
					extensions: {
						code: FALLBACK_ERROR.extensions.code,
					},
					message: error.message,
				},
			],
		});
	});

	test('Do not expose error data to non-admin users', async () => {
		await errorHandlerMod.errorHandler(error, mockRequest, mockResponse, nextFunction);

		expect(mockResponse.json).toHaveBeenCalledWith({ errors: [FALLBACK_ERROR] });
	});
});

test('Catch error within the handler and respond with fallback error', async () => {
	// Provoke error within handler
	const handlerError = new Error('Unexpected error');

	mockResponse.json = vi.fn().mockImplementationOnce(() => {
		throw handlerError;
	});

	const appError = new (createError('TOO_EARLY', `Rabbit still sleeping`, 425))();

	await errorHandlerMod.errorHandler(appError, mockRequest, mockResponse, nextFunction);

	expect(mockLogger.error).toHaveBeenLastCalledWith(handlerError, 'Unexpected error in error handler');

	expect(mockResponse.status).toHaveBeenCalledWith(FALLBACK_STATUS);
	expect(mockResponse.json).toHaveBeenCalledWith({ errors: [FALLBACK_ERROR] });
});

describe('MCP OAuth RFC 6750 WWW-Authenticate', () => {
	function setupMcpMocks(path: string) {
		mockRequest.path = path;

		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_ENABLED: true,
			PUBLIC_URL: 'http://localhost:8055',
		} as any);

		// Chain-friendly mock response for the MCP path
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		} as unknown as Response;
	}

	test.each([
		['InvalidCredentialsError', () => new InvalidCredentialsError()],
		['InvalidTokenError', () => new InvalidTokenError()],
		['TokenExpiredError', () => new TokenExpiredError()],
	])('%s on /mcp returns 401 with WWW-Authenticate', async (_name, createError) => {
		setupMcpMocks('/mcp');
		await errorHandlerMod.errorHandler(createError(), mockRequest, mockResponse, nextFunction);
		expectMcpBearerChallenge(mockResponse, { status: 401, resourceMetadata: true });
	});

	test('TokenExpiredError on /mcp sub-path returns 401 with WWW-Authenticate', async () => {
		setupMcpMocks('/mcp/sub-path');

		await errorHandlerMod.errorHandler(new TokenExpiredError(), mockRequest, mockResponse, nextFunction);

		expectMcpBearerChallenge(mockResponse, { status: 401, resourceMetadata: true });
	});

	test('auth failure on /mcp-oauth path does NOT get WWW-Authenticate treatment', async () => {
		setupMcpMocks('/mcp-oauth/authorize/decision');

		await errorHandlerMod.errorHandler(new InvalidCredentialsError(), mockRequest, mockResponse, nextFunction);

		// Should fall through to normal error handling, not the MCP 401 path
		expect(mockResponse.set).not.toHaveBeenCalledWith('WWW-Authenticate', expect.anything());
	});
});
