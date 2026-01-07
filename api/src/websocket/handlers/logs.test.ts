import { ErrorCode } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { getAllowedLogLevels } from '../../utils/get-allowed-log-levels.js';
import { WebSocketError } from '../errors.js';
import type { WebSocketClient } from '../types.js';
import { LogsHandler } from './logs.js';

// mocking
vi.mock('../controllers', () => ({
	getLogsController: vi.fn(() => ({
		clients: new Set(),
	})),
}));

vi.mock('../../database/index');
vi.mock('../errors.js');

function mockClient(isAdmin: boolean) {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability: { admin: isAdmin },
	} as unknown as WebSocketClient;
}

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

describe('WebSocket logs handler', () => {
	let handler: LogsHandler;

	beforeEach(() => {
		// initialize handler
		handler = new LogsHandler();
	});

	afterEach(() => {
		emitter.offAll();
		vi.clearAllMocks();
	});

	test('ignore other message types', async () => {
		const spy = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction('websocket.message', {
			client: mockClient(true),
			message: { type: 'ping' },
		});

		emitter.emitAction('websocket.message', {
			client: mockClient(true),
			message: { type: 'subscribe', log_level: 'asd' },
		});

		emitter.emitAction('websocket.logs', {
			client: mockClient(true),
			message: { type: 'invalid', log_level: 'asd' },
		});

		emitter.emitAction('websocket.logs', {
			client: mockClient(true),
			message: { type: 'subscribe' },
		});

		// expect nothing
		expect(spy).not.toBeCalled();
	});

	test('should fail subscribe to invalid log level', async () => {
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction('websocket.logs', {
			client: mockClient(true),
			message: {
				type: 'subscribe',
				log_level: 'invalid',
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalled();
		expect(subscribe).toBeCalled();
		expect(WebSocketError).toBeCalledWith('logs', ErrorCode.InvalidPayload, expect.any(String));
	});

	test('should subscribe to logs above the requested log level', async () => {
		const client = mockClient(true);
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');
		const logLevel = 'info';

		// receive message
		emitter.emitAction('websocket.logs', {
			client,
			message: {
				type: 'subscribe',
				log_level: logLevel,
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalled();
		expect(subscribe).toBeCalled();

		for (const level of Object.keys(getAllowedLogLevels(logLevel))) {
			expect(handler.subscriptions[level]?.size).toBe(1);
		}

		expect(handler.subscriptions['trace']?.size).toBe(0);
		expect(handler.subscriptions['debug']?.size).toBe(0);
	});

	test('unsubscribes to lower log levels when subscribing to a higher log level', async () => {
		const client = mockClient(true);
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');
		const firstLogLevel = 'trace';
		const finalLogLevel = 'info';

		// subscribe
		emitter.emitAction('websocket.logs', {
			client,
			message: {
				type: 'subscribe',
				log_level: firstLogLevel,
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalled();
		expect(subscribe).toBeCalled();

		for (const level of Object.keys(getAllowedLogLevels(firstLogLevel))) {
			expect(handler.subscriptions[level]?.size).toBe(1);
		}

		// subscribe to a higher log level
		emitter.emitAction('websocket.logs', {
			client,
			message: {
				type: 'subscribe',
				log_level: finalLogLevel,
			},
		});

		await delay(10);

		// expect
		for (const level of Object.keys(getAllowedLogLevels(finalLogLevel))) {
			expect(handler.subscriptions[level]?.size).toBe(1);
		}

		expect(handler.subscriptions['trace']?.size).toBe(0);
		expect(handler.subscriptions['debug']?.size).toBe(0);
	});

	test('unsubscribe all subscriptions', async () => {
		const client = mockClient(true);
		const client2 = mockClient(true);
		const unsubscribe = vi.spyOn(handler, 'unsubscribe');
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');
		const logLevel = 'trace';

		// subscribe
		emitter.emitAction('websocket.logs', {
			client,
			message: {
				type: 'subscribe',
				log_level: logLevel,
			},
		});

		emitter.emitAction('websocket.logs', {
			client: client2,
			message: {
				type: 'subscribe',
				log_level: logLevel,
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalledTimes(2);
		expect(subscribe).toBeCalledTimes(2);

		for (const level of Object.keys(getAllowedLogLevels(logLevel))) {
			expect(handler.subscriptions[level]?.size).toBe(2);
		}

		// unsubscribe
		emitter.emitAction('websocket.logs', {
			client,
			message: {
				type: 'unsubscribe',
			},
		});

		await delay(10);

		// expect
		expect(unsubscribe).toBeCalledTimes(1);
		expect(unsubscribe).toBeCalledWith(client);

		for (const level of Object.keys(getAllowedLogLevels(logLevel))) {
			expect(handler.subscriptions[level]?.size).toBe(1);
			expect(handler.subscriptions[level]?.has(client)).toBe(false);
			expect(handler.subscriptions[level]?.has(client2)).toBe(true);
		}
	});
});
