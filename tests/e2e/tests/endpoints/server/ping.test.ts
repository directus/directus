import { createDirectus, graphql, rest, serverPing, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));

test('ping', async () => {
	const result = await api.request(serverPing());

	expect(result).toBe('pong');
});

test('ping responds as html without authentication', async () => {
	const response = await fetch(`http://localhost:${port}/server/ping`);

	expect(response.status).toBe(200);
	expect(response.headers.get('content-type')).toMatch(/text\/html/);
	expect(await response.text()).toBe('pong');
});

test('ping through the system graphql schema', async () => {
	const result = await api.query<{ server_ping: string }>(`query { server_ping }`, undefined, 'system');

	expect(result.server_ping).toBe('pong');
});
