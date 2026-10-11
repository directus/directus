import { describe, expect, test, vi } from 'vitest';
import { flush, openConnection } from './helpers/fake-websocket.js';

/**
 * `onWebSocket('message', ...)` is the only event this composable wraps before handing it over,
 * and the wrapper's event parameter is typed with the SDK's own `MessageEventInterface` instead
 * of the DOM's `MessageEvent`, which is only generic inside the DOM lib.
 */
describe("onWebSocket('message')", () => {
	test('delivers the decoded frame to the handler', async () => {
		const { client, socket } = await openConnection();
		const handler = vi.fn();

		client.onWebSocket('message', handler);
		await socket.receive({ type: 'items', event: 'create' });

		expect(handler).toHaveBeenCalledWith({ type: 'items', event: 'create' });

		client.disconnect();
	});

	test('stops delivering once the returned remover is called', async () => {
		const { client, socket } = await openConnection();
		const handler = vi.fn();

		const remove = client.onWebSocket('message', handler);
		await socket.receive({ type: 'items', event: 'create' });
		expect(handler).toHaveBeenCalledTimes(1);

		// The remover has to find the wrapper the composable registered, not the handler itself.
		remove();
		await socket.receive({ type: 'items', event: 'update' });
		await flush();

		expect(handler).toHaveBeenCalledTimes(1);

		client.disconnect();
	});
});
