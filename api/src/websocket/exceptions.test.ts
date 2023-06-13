import { describe, expect, test, vi } from 'vitest';
import type { WebSocketClient } from './types.js';
import { BaseException } from '@directus/exceptions';
import { InvalidPayloadException } from '../index.js';
import { WebSocketException, handleWebSocketException } from './exceptions.js';
import { ZodError } from 'zod';
import logger from '../logger.js';

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

describe('WebSocketException', () => {
	test('with uid', () => {
		const error = new WebSocketException('type', 'code', 'message', 123);
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
		const error = new WebSocketException('type', 'code', 'message');
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

describe('handleWebSocketException', () => {
	const type = 'testing';

	test('handle BaseException', () => {
		const client = mockClient();
		const error = new BaseException('test', 200, '123');
		const expected = WebSocketException.fromException(error, type).toMessage();
		handleWebSocketException(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(logger.error).not.toBeCalled();
	});

	test('handle InvalidPayloadException', () => {
		const client = mockClient();
		const error = new InvalidPayloadException('test');
		const expected = WebSocketException.fromException(error, type).toMessage();
		handleWebSocketException(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(logger.error).not.toBeCalled();
	});

	test('handle WebSocketException', () => {
		const client = mockClient();
		const error = new WebSocketException('type', 'code', 'message', 123);
		const expected = error.toMessage();
		handleWebSocketException(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(logger.error).not.toBeCalled();
	});

	test('handle ZodError', () => {
		const client = mockClient();

		const error = new ZodError([
			{ message: 'test', code: 'invalid_type', path: ['path'], expected: 'array', received: 'string' },
		]);

		const expected = WebSocketException.fromZodError(error, type).toMessage();
		handleWebSocketException(client, error, type);
		expect(client.send).toBeCalledWith(expected);
		expect(logger.error).not.toBeCalled();
	});

	test('unhandled exception', () => {
		const client = mockClient();
		const error = new Error('regular error');
		handleWebSocketException(client, error, type);
		expect(client.send).not.toBeCalled();
		expect(logger.error).toBeCalled();
	});
});
