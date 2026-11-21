import type { AddressInfo } from 'node:net';
import express from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const env: Record<string, unknown> = {};

vi.mock('@directus/env', () => ({ useEnv: () => env }));

async function preflight(path: string, requestHeaders?: string) {
	vi.resetModules();

	const { default: cors } = await import('./cors.js');
	const server = express().use(cors).listen(0);

	try {
		const { port } = server.address() as AddressInfo;

		return await fetch(`http://127.0.0.1:${port}${path}`, {
			method: 'OPTIONS',
			headers: {
				Origin: 'https://client.example.com',
				'Access-Control-Request-Method': 'POST',
				...(requestHeaders && { 'Access-Control-Request-Headers': requestHeaders }),
			},
		});
	} finally {
		server.close();
	}
}

describe('cors', () => {
	beforeEach(() => {
		Object.assign(env, {
			CORS_ENABLED: true,
			CORS_ORIGIN: true,
			CORS_METHODS: 'GET,POST',
			CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
			CORS_EXPOSED_HEADERS: ['Content-Range'],
			CORS_CREDENTIALS: true,
			CORS_MAX_AGE: 18000,
		});
	});

	test('allows the MCP protocol headers on /mcp', async () => {
		const response = await preflight('/mcp');

		expect(response.headers.get('access-control-allow-headers')).toBe(
			'Content-Type,Authorization,MCP-Protocol-Version,Mcp-Method,Mcp-Name',
		);
	});

	test.each(['/MCP', '/mcp/', '/mcp//', '/mcp?x=1'])('allows the MCP protocol headers on %s', async (path) => {
		const response = await preflight(path);

		expect(response.headers.get('access-control-allow-headers')).toContain('MCP-Protocol-Version');
	});

	test('splits a string allowlist before adding the MCP headers', async () => {
		env['CORS_ALLOWED_HEADERS'] = 'Content-Type, Authorization';

		const response = await preflight('/mcp');

		expect(response.headers.get('access-control-allow-headers')).toBe(
			'Content-Type,Authorization,MCP-Protocol-Version,Mcp-Method,Mcp-Name',
		);
	});

	test('reflects the requested headers on /mcp when the allowlist is empty', async () => {
		env['CORS_ALLOWED_HEADERS'] = '';

		const response = await preflight('/mcp', 'Authorization,Content-Type,Mcp-Method');

		expect(response.headers.get('access-control-allow-headers')).toBe('Authorization,Content-Type,Mcp-Method');
	});

	test.each(['/items/articles', '/mcp-oauth/authorize', '/mcp-other'])(
		'keeps the configured headers on %s',
		async (path) => {
			const response = await preflight(path);

			expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type,Authorization');
		},
	);
});
