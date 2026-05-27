import { createError, InvalidPayloadError } from '@directus/errors';
import { type Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ZodError } from 'zod';
import { useLogger } from '../logger/index.js';
import { handleWebSocketError, WebSocketError } from './errors.js';
import type { WebSocketClient } from './types.js';

const TestError = createError('test', '123', 200);

vi.mock('../logger');

function mockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability: null,
	} as unknown as WebSocketClient;
}

let mockLogger: Logger<never>;

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
	} as unknown as Logger<never>;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('WebSocketError', () => {
	test('with uid', () => {
		const error = new WebSocketError('type', 'code', 'message', 123);
		const response = error.toJSON();

		expect(response).toStrictEqual({
			type: 'type',
			status: 'error',
			error: {
				code: 'code',
				message: 'message',
			},
			uid: 123,
		});

		expect(error.toMessage()).toBe(JSON.stringify(response));
	});

	test('without uid', () => {
		const error = new WebSocketError('type', 'code', 'message');
		const response = error.toJSON();

		expect(response).toStrictEqual({
			type: 'type',
			status: 'error',
			error: {
				code: 'code',
				message: 'message',
			},
		});

		expect(error.toMessage()).toBe(JSON.stringify(response));
	});
});

describe('handleWebSocketError', () => {
	const type = 'testing';

	test('handle BaseException', () => {
		const client = mockClient();
		const error = new TestError();
		const expected = WebSocketError.fromError(error, type).toMessage();
		handleWebSocketError(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(mockLogger.error).not.toBeCalled();
	});

	test('handle InvalidPayloadError', () => {
		const client = mockClient();
		const error = new InvalidPayloadError({ reason: 'test' });
		const expected = WebSocketError.fromError(error, type).toMessage();
		handleWebSocketError(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(mockLogger.error).not.toBeCalled();
	});

	test('handle WebSocketError', () => {
		const client = mockClient();
		const error = new WebSocketError('type', 'code', 'message', 123);
		const expected = error.toMessage();
		handleWebSocketError(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(mockLogger.error).not.toBeCalled();
	});

	test('handle ZodError', () => {
		const client = mockClient();

		const error = new ZodError([
			{ message: 'test', code: 'invalid_type', path: ['path'], expected: 'array', received: 'string' },
		]);

		const expected = WebSocketError.fromZodError(error, type).toMessage();
		handleWebSocketError(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(mockLogger.error).not.toBeCalled();
	});

	test('unhandled exception', () => {
		const client = mockClient();
		const error = new Error('regular error');
		handleWebSocketError(client, error, type);
		expect(client.send).not.toBeCalled();
		expect(mockLogger.error).toBeCalled();
	});
});
