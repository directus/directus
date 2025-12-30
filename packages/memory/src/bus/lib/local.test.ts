import { BusLocal } from './local.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

let bus: BusLocal;

beforeEach(() => {
	bus = new BusLocal({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('publish', () => {
	test('Is a no-op when no handlers are registered for channel', async () => {
		const mockChannel = 'mock-channel';
		const mockPayload = { hello: 'world' };

		await bus.publish(mockChannel, mockPayload);
	});

	test('Calls each registered callback of the channel with the given payload', async () => {
		const mockChannel = 'mock-channel';
		const mockPayload = { hello: 'world' };
		const mockHandlers = [vi.fn(), vi.fn()];

		bus['handlers'][mockChannel] = new Set(mockHandlers);

		await bus.publish(mockChannel, mockPayload);

		for (const handler of mockHandlers) {
			expect(handler).toBeCalledWith(mockPayload);
		}
	});

	test('Ignores errors thrown in the registered callbacks', async () => {
		const mockChannel = 'mock-channel';
		const mockPayload = { hello: 'world' };

		const mockHandlers = [
			vi.fn().mockImplementation(() => {
				throw new Error('bad news');
			}),
			vi.fn(),
		];

		bus['handlers'][mockChannel] = new Set(mockHandlers);

		await bus.publish(mockChannel, mockPayload);

		for (const handler of mockHandlers) {
			expect(handler).toBeCalledWith(mockPayload);
		}
	});
});

describe('subscribe', () => {
	test('Creates new set with the passed callback if handler set does not exist yet', async () => {
		const mockChannel = 'mock-channel';
		const mockHandler = vi.fn();

		await bus.subscribe(mockChannel, mockHandler);

		expect(bus['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(bus['handlers'][mockChannel]?.size).toBe(1);
		expect(bus['handlers'][mockChannel]?.values().next().value).toBe(mockHandler);
	});

	test('Adds callback handler if set already exists', async () => {
		const mockChannel = 'mock-channel';
		const existingHandler = vi.fn();
		const mockHandler = vi.fn();

		bus['handlers'][mockChannel] = new Set([existingHandler]);

		await bus.subscribe(mockChannel, mockHandler);

		expect(bus['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(bus['handlers'][mockChannel]?.size).toBe(2);

		const handlers = Array.from(bus['handlers'][mockChannel]);
		expect(handlers[0]).toBe(existingHandler);
		expect(handlers[1]).toBe(mockHandler);
	});
});

describe('unsubscribe', () => {
	test('Is a no-op if channel does not exist', async () => {
		const mockChannel = 'mock-channel';
		const mockHandler = vi.fn();

		await bus.unsubscribe(mockChannel, mockHandler);
	});

	test('Removes the handler from the existing', async () => {
		const mockChannel = 'mock-channel';
		const existingHandler = vi.fn();
		const mockHandler = vi.fn();

		bus['handlers'][mockChannel] = new Set([existingHandler, mockHandler]);

		await bus.unsubscribe(mockChannel, mockHandler);

		expect(bus['handlers'][mockChannel]).toBeInstanceOf(Set);
		expect(bus['handlers'][mockChannel]?.size).toBe(1);

		const handlers = Array.from(bus['handlers'][mockChannel]);
		expect(handlers[0]).toBe(existingHandler);
	});
});
