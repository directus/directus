import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { Response } from 'express';
import { expect, test, vi } from 'vitest';
import { destroyOnDisconnect } from './destroy-on-disconnect.js';

/**
 * A real response, because the util reads the state Node keeps on it. A `PassThrough` reports itself
 * closed the moment it is destroyed, where a response only does once the event fires, so it would
 * not tell the two apart.
 */
const response = () => new ServerResponse(new IncomingMessage(new Socket())) as unknown as Response;

test('destroys the source when the client disconnects before the response was written', () => {
	const res = response();
	const destroy = vi.fn();

	expect(destroyOnDisconnect(res, destroy)).toBe(false);

	res.write('partial');
	res.emit('close');

	expect(destroy).toHaveBeenCalledOnce();
});

test('leaves the source alone when the response was fully written', () => {
	const res = response();
	const destroy = vi.fn();

	expect(destroyOnDisconnect(res, destroy)).toBe(false);

	res.end('done');
	res.emit('close');

	expect(destroy).not.toHaveBeenCalled();
});

test('destroys the source and reports the response gone when it was already destroyed', () => {
	const res = response();
	const destroy = vi.fn();

	// Destroying leaves `closed` false until the event fires, so only `destroyed` catches this
	res.destroy();
	expect(res.closed).toBe(false);

	expect(destroyOnDisconnect(res, destroy)).toBe(true);
	expect(destroy).toHaveBeenCalledOnce();
});

test('destroys the source and reports the response gone when it was already closed', () => {
	const res = response();
	const destroy = vi.fn();

	vi.spyOn(res, 'closed', 'get').mockReturnValue(true);

	expect(destroyOnDisconnect(res, destroy)).toBe(true);
	expect(destroy).toHaveBeenCalledOnce();
});
