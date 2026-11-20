import { describe, expect, test } from 'vitest';
import { realtime } from '../../src/realtime/composable.js';
import { createClient, openSocket } from './helpers/fake-websocket.js';

describe('realtime default websocket URL', () => {
	test.each([
		{ url: 'http://example.com', expected: 'ws://example.com/websocket' },
		{ url: 'https://example.com', expected: 'wss://example.com/websocket' },
		{ url: 'http://example.com/directus', expected: 'ws://example.com/directus/websocket' },
		{ url: 'http://example.com/directus/', expected: 'ws://example.com/directus/websocket' },
		{ url: 'https://example.com/a/b', expected: 'wss://example.com/a/b/websocket' },
		{ url: 'http://example.com/directus?foo=bar#hash', expected: 'ws://example.com/directus/websocket' },
	])('derives $expected from $url', async ({ url, expected }) => {
		const client = createClient(url).with(realtime({ reconnect: false }));
		const connecting = client.connect();

		const socket = await openSocket();
		await connecting;

		expect(socket.url).toBe(expected);

		client.disconnect();
	});

	test('uses a ws URL passed to the client as is', async () => {
		const client = createClient('ws://example.com/custom').with(realtime({ reconnect: false }));
		const connecting = client.connect();

		const socket = await openSocket();
		await connecting;

		expect(socket.url).toBe('ws://example.com/custom');

		client.disconnect();
	});
});
