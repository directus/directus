import { beforeAll, describe, expect, test } from 'vitest';
import {
	adminToken,
	baseUrl,
	createNonAdminToken,
	createOAuthTokens,
	enableMcpOAuthSettings,
	expectJsonResponse,
	refreshToken,
	registerPublicClient,
} from './mcp-oauth-utils.js';

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

describe('/mcp-oauth/clients admin endpoints', () => {
	test('non-admin token gets 403 for client listing', async () => {
		const token = await createNonAdminToken();

		const response = await fetch(`${baseUrl}/mcp-oauth/clients`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const body = (await expectJsonResponse(response, 403)) as { errors?: unknown[] };

		expect(body.errors).toEqual(expect.any(Array));
	});

	test('admin token gets client listing', async () => {
		const response = await fetch(`${baseUrl}/mcp-oauth/clients`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		const body = (await expectJsonResponse(response, 200)) as { data?: unknown[] };

		expect(body.data).toEqual(expect.any(Array));
	});

	test('admin can fetch a registered client by id', async () => {
		const clientId = await registerPublicClient();

		const response = await fetch(`${baseUrl}/mcp-oauth/clients/${clientId}`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		const body = (await expectJsonResponse(response, 200)) as { data?: { client_id?: string } };

		expect(body.data).toMatchObject({ client_id: clientId });
	});

	test('admin can delete a client and cascade OAuth state', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		await expectJsonResponse(
			await fetch(`${baseUrl}/mcp-oauth/clients/${clientId}`, {
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}),
			200,
		);

		const deleteResponse = await fetch(`${baseUrl}/mcp-oauth/clients/${clientId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(deleteResponse.status).toBe(204);

		const afterDeleteResponse = await fetch(`${baseUrl}/mcp-oauth/clients/${clientId}`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(afterDeleteResponse.status).toBe(403);

		const refreshResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		const refreshBody = (await expectJsonResponse(refreshResponse, 400)) as { error?: string };

		expect(refreshBody).toMatchObject({ error: 'invalid_grant' });
	});
});
