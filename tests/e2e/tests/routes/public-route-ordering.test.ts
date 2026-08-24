import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

const baseUrl = `http://localhost:${port}`;

test('pre-auth public routes ignore invalid bearer tokens', async () => {
	const response = await fetch(`${baseUrl}/server/ping`, {
		headers: { Authorization: 'Bearer invalid-token' },
	});

	expect(response.status).toBe(200);
	await expect(response.text()).resolves.toBe('pong');
});

test('normal authenticated routes keep Directus auth error shape with invalid bearer tokens', async () => {
	const response = await fetch(`${baseUrl}/users/me`, {
		headers: { Authorization: 'Bearer invalid-token' },
	});

	const body = (await response.json()) as { error?: unknown; errors?: Array<{ extensions?: { code?: string } }> };

	expect(response.status).toBe(401);
	expect(body.error).toBeUndefined();
	expect(body.errors?.[0]?.extensions?.code).toBe('INVALID_CREDENTIALS');
});
