import { beforeEach, describe, expect, test, vi } from 'vitest';
import { withCache } from './with-cache.js';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();

vi.mock('../cache.js', () => ({
	useCache: () => ({
		get: mockGet,
		set: mockSet,
		delete: mockDelete,
	}),
}));

describe('withCache', () => {
	beforeEach(() => {
		mockGet.mockReset();
		mockSet.mockReset();
	});

	test('returns the handler result when no cached value exists', async () => {
		mockGet.mockResolvedValue(undefined);

		const handler = vi.fn(async (a: number, b: number) => a + b);
		const wrapped = withCache('sum', handler);

		const result = await wrapped(2, 3);

		expect(result).toBe(5);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(mockSet).toHaveBeenCalledTimes(1);
	});

	test('returns cached result and does not call handler again', async () => {
		mockGet.mockResolvedValue(10);

		const handler = vi.fn(async (a: number, b: number) => a + b);
		const wrapped = withCache('sum', handler);

		const result = await wrapped(1, 2);

		expect(result).toBe(10);
		expect(handler).not.toHaveBeenCalled();
		expect(mockSet).not.toHaveBeenCalled();
	});

	test('creates unique cache key based on arguments', async () => {
		mockGet.mockResolvedValue(undefined);

		const namespace = 'namespace';
		const handler = vi.fn(async (a: number, b: number) => a + b);
		const wrapped = withCache(namespace, handler);

		await wrapped(1, 2);

		expect(mockGet).toHaveBeenCalledTimes(1);
		const keyUsed = mockGet.mock.calls[0]?.[0];

		// uses namespace + hash
		expect(keyUsed.startsWith(namespace)).toBe(true);
	});

	test('uses prepareArg to generate a stable key', async () => {
		mockGet.mockResolvedValue(undefined);

		const handler = vi.fn(async (a: { id: number; title: string }, b: number) => a.id + b);

		const prepareArg = vi.fn((a) => ({
			// picks only `id` to stabilize
			id: a.id,
		}));

		const wrapped = withCache('item', handler, prepareArg);
		const arg1 = { id: 5, title: 'hello' };
		const arg2 = 5;

		await wrapped(arg1, arg2);

		expect(prepareArg).toHaveBeenCalledTimes(1);
		expect(prepareArg).toHaveBeenCalledWith(arg1, arg2);

		const keyUsed = mockGet.mock.calls[0]?.[0];
		expect(keyUsed.startsWith('item')).toBe(true);
	});

	test('passes original args to handler, even when prepareArg is used', async () => {
		mockGet.mockResolvedValue(undefined);

		const arg1 = 1;
		const arg2 = 3;

		const handler = vi.fn(async (a: number, b: number) => a + b);
		const prepareArg = vi.fn((a) => ({ pick: a }));

		const wrapped = withCache('test', handler, prepareArg);

		await wrapped(arg1, arg2);

		expect(handler).toHaveBeenCalledWith(arg1, arg2, expect.any(Function));
	});

	test('stores handler result in cache after execution', async () => {
		mockGet.mockResolvedValue(undefined);

		const handler = vi.fn(async () => 999);
		const wrapped = withCache('save', handler);

		await wrapped();

		expect(mockSet).toHaveBeenCalledTimes(1);
		expect(mockSet.mock.calls[0]?.[1]).toBe(999);
	});

	test('supports async handler results', async () => {
		mockGet.mockResolvedValue(undefined);

		const handler = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 5));
			return 'async-value';
		});

		const wrapped = withCache('async', handler);

		const result = await wrapped();

		expect(result).toBe('async-value');
	});

	test('child cache invalidates parent cache', async () => {
		const cache: Record<string, unknown> = {};

		mockSet.mockImplementation((key, value) => (cache[key] = value));
		mockGet.mockImplementation((key) => cache[key]!);
		mockDelete.mockImplementation((key) => delete cache[key]);

		let invalidateCallback;
		let i = 0;

		const handler = vi.fn(() => i++);

		const handlerCached = withCache('related', handler, undefined, (invalidate) => {
			invalidateCallback = invalidate;
		});

		const parentHandler = vi.fn(async () => (await handlerCached()) + 1);

		const parentHandlerCached = withCache('parent', parentHandler);

		expect(await parentHandlerCached()).toBe(1);
		expect(await parentHandlerCached()).toBe(1);
		expect(await handlerCached()).toBe(0);

		invalidateCallback!();

		expect(await parentHandlerCached()).toBe(2);
		expect(await parentHandlerCached()).toBe(2);
		expect(await handlerCached()).toBe(1);
	});
});
