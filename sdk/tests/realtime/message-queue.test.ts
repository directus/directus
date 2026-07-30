import { describe, expect, test, vi } from 'vitest';
import { createMessageQueue, MAX_QUEUED_MESSAGES } from '../../src/realtime/utils/message-queue.js';

describe('createMessageQueue', () => {
	test('delivers messages pushed before the consumer pulls, in order', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		queue.push(1);
		queue.push(2);

		await expect(stream.next()).resolves.toMatchObject({ value: 1 });
		await expect(stream.next()).resolves.toMatchObject({ value: 2 });
	});

	test('parks the consumer until a message arrives', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		const settled = vi.fn();
		const pull = stream.next().then(settled);

		await Promise.resolve();
		expect(settled).not.toHaveBeenCalled();

		queue.push(1);
		await pull;

		expect(settled).toHaveBeenCalledWith({ done: false, value: 1 });
	});

	test('end() lets the consumer drain what is queued before completing', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		queue.push(1);
		queue.end();
		queue.push(2);

		await expect(stream.next()).resolves.toMatchObject({ value: 1 });
		await expect(stream.next()).resolves.toEqual({ done: true, value: undefined });
	});

	test('fail() rejects the consumer with the reason', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		const pull = stream.next();
		const reason = new Error('boom');
		queue.dispose(reason);

		await expect(pull).rejects.toBe(reason);
	});

	test('fail() rejects the consumer with the first reason', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		const pull = stream.next();
		const reason = new Error('boom');
		queue.dispose(reason);
		queue.dispose(new Error('splat'));

		await expect(pull).rejects.toBe(reason);
		await expect(pull).rejects.toBe(reason);
	});

	test('dispose() drops what is queued and completes immediately', async () => {
		const queue = createMessageQueue<number>();
		const stream = queue.stream();

		queue.push(1);
		queue.dispose();

		await expect(stream.next()).resolves.toEqual({ done: true, value: undefined });
	});

	test('calls onEnd once, whichever way the stream is over', async () => {
		const onEnd = vi.fn();
		const queue = createMessageQueue<number>({ onEnd });
		const stream = queue.stream();

		queue.push(1);
		await stream.next();

		// The consumer stops iterating without draining.
		await stream.return();
		queue.end();
		queue.dispose();

		expect(onEnd).toHaveBeenCalledTimes(1);
	});

	test('drops the oldest messages past the limit and reports the total', async () => {
		const onDrop = vi.fn();
		const queue = createMessageQueue<number>({ limit: 2, onDrop });
		const stream = queue.stream();

		// Nobody is pulling, so the consumer only gets the most recent two.
		queue.push(1);
		queue.push(2);
		queue.push(3);
		queue.push(4);

		expect(onDrop.mock.calls).toEqual([[1], [2]]);

		await expect(stream.next()).resolves.toMatchObject({ value: 3 });
		await expect(stream.next()).resolves.toMatchObject({ value: 4 });
	});

	test('holds MAX_QUEUED_MESSAGES by default', async () => {
		const onDrop = vi.fn();
		const queue = createMessageQueue<number>({ onDrop });
		const stream = queue.stream();

		for (let index = 0; index < MAX_QUEUED_MESSAGES; index++) {
			queue.push(index);
		}

		expect(onDrop).not.toHaveBeenCalled();

		queue.push(MAX_QUEUED_MESSAGES);

		expect(onDrop).toHaveBeenCalledExactlyOnceWith(1);
		// The first message made room for the last.
		await expect(stream.next()).resolves.toMatchObject({ value: 1 });
	});
});
