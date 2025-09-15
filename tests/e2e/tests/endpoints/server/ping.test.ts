import { createDirectus, rest, serverPing, staticToken } from '@directus/sdk';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

test('ping', async () => {
	const result = await api.request(serverPing());

	expect(result).toBe('pong');
});
