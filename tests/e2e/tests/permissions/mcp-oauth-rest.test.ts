import crypto from 'node:crypto';
import { createDirectus, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { beforeAll, describe, expect, test } from 'vitest';
import {
	adminToken,
	baseUrl,
	createOAuthTokens,
	enableMcpOAuthSettings,
	expectJsonResponse,
	loginAsAdminSession,
} from '../auth/mcp-oauth-utils.js';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken(adminToken));
const { collections } = await useSnapshot<Schema>(api);

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

describe('MCP OAuth tokens on REST items', () => {
	test('OAuth token cannot read or write a regular collection', async () => {
		const { tokens } = await createOAuthTokens();
		const name = `oauth-blocked-${crypto.randomUUID()}`;

		const readResponse = await fetch(`${baseUrl}/items/${collections.trains}`, {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});

		const createResponse = await fetch(`${baseUrl}/items/${collections.trains}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name }),
		});

		await expectJsonResponse(readResponse, 403);
		await expectJsonResponse(createResponse, 403);

		const created = await api.request(readItems(collections.trains, { filter: { name: { _eq: name } } }));

		expect(created).toHaveLength(0);
	});

	test('OAuth header or query token takes precedence over an admin session cookie', async () => {
		const { tokens } = await createOAuthTokens();
		const adminCookie = await loginAsAdminSession();
		const token = encodeURIComponent(tokens.access_token);
		const name = `oauth-cookie-precedence-${crypto.randomUUID()}`;

		const headerResponse = await fetch(`${baseUrl}/items/${collections.trains}`, {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				Cookie: adminCookie,
			},
		});

		const queryResponse = await fetch(`${baseUrl}/items/${collections.trains}?access_token=${token}`, {
			headers: { Cookie: adminCookie },
		});

		const createResponse = await fetch(`${baseUrl}/items/${collections.trains}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				Cookie: adminCookie,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name }),
		});

		await expectJsonResponse(headerResponse, 403);
		await expectJsonResponse(queryResponse, 403);
		await expectJsonResponse(createResponse, 403);

		const created = await api.request(readItems(collections.trains, { filter: { name: { _eq: name } } }));

		expect(created).toHaveLength(0);
	});
});
