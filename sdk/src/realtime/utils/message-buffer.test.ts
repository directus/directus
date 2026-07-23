import { describe, expect, test, vi } from 'vitest';
import { createMessageBuffer } from './message-buffer.js';

describe('createMessageBuffer', () => {
	test('delivers a message pushed before next() is called', async () => {
		const buffer = createMessageBuffer<string>();

		buffer.push('a');

		await expect(buffer.next()).resolves.toBe('a');
	});

	test('parks next() until a message is pushed', async () => {
		const buffer = createMessageBuffer<string>();

		const settled = vi.fn();
		const pull = buffer.next().then(settled);

		// Nothing buffered yet: the pull stays pending.
		await Promise.resolve();
		expect(settled).not.toHaveBeenCalled();

		buffer.push('a');
		await pull;

		expect(settled).toHaveBeenCalledWith('a');
	});

	test('drains buffered messages in FIFO order', async () => {
		const buffer = createMessageBuffer<number>();

		buffer.push(1);
		buffer.push(2);
		buffer.push(3);

		await expect(buffer.next()).resolves.toBe(1);
		await expect(buffer.next()).resolves.toBe(2);
		await expect(buffer.next()).resolves.toBe(3);
	});

	test("resolves parked next()'s in the order they were queued", async () => {
		const buffer = createMessageBuffer<string>();

		// Async generators serialize next() calls, but the buffer should still be
		// robust when a pull is parked and a message arrives afterwards.
		const first = buffer.next();
		buffer.push('a');

		await expect(first).resolves.toBe('a');
	});

	test('resolves undefined once the stream is ended and drained', async () => {
		const buffer = createMessageBuffer<string>();

		buffer.push('a');
		buffer.end();

		// Buffered messages are delivered before the stream terminates.
		await expect(buffer.next()).resolves.toBe('a');
		await expect(buffer.next()).resolves.toBeUndefined();
		// Stays terminated.
		await expect(buffer.next()).resolves.toBeUndefined();
	});

	test('wakes a parked pull with undefined when ended', async () => {
		const buffer = createMessageBuffer<string>();

		const pull = buffer.next();
		buffer.end();

		await expect(pull).resolves.toBeUndefined();
	});

	test('end({ discard }) drops buffered messages and terminates immediately', async () => {
		const buffer = createMessageBuffer<string>();

		buffer.push('a');
		buffer.push('b');
		buffer.end({ discard: true });

		await expect(buffer.next()).resolves.toBeUndefined();
	});

	test('ignores messages pushed after the stream ends', async () => {
		const buffer = createMessageBuffer<string>();

		buffer.end();
		buffer.push('a');

		await expect(buffer.next()).resolves.toBeUndefined();
	});

	test('rejects the next pull with the failure reason', async () => {
		const buffer = createMessageBuffer<string>();

		const reason = { type: 'subscribe', status: 'error' };
		buffer.fail(reason);

		await expect(buffer.next()).rejects.toBe(reason);
	});

	test('rejects a parked pull when the buffer fails', async () => {
		const buffer = createMessageBuffer<string>();

		const pull = buffer.next();
		const reason = new Error('boom');
		buffer.fail(reason);

		await expect(pull).rejects.toBe(reason);
	});

	test('keeps the first failure reason and ignores later signals', async () => {
		const buffer = createMessageBuffer<string>();

		const reason = new Error('first');
		buffer.fail(reason);
		buffer.fail(new Error('second'));
		buffer.push('a');

		await expect(buffer.next()).rejects.toBe(reason);
	});
});
