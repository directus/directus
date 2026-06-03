import crypto from 'node:crypto';
import { beforeAll, describe, expect, test } from 'vitest';
import {
	adminToken,
	baseUrl,
	createNonAdminToken,
	createOAuthTokens,
	enableMcpOAuthSettings,
	expectJsonResponse,
	refreshToken,
	registerConfidentialClient,
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

	test('admin client detail redacts confidential client_secret_hash', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-client-secret-hash-callback`,
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const response = await fetch(`${baseUrl}/mcp-oauth/clients/${client.clientId}`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		const body = (await expectJsonResponse(response, 200)) as {
			data?: { client_secret_hash?: string };
		};

		const expectedHash = crypto.createHash('sha256').update(client.clientSecret).digest('hex');
		const serialized = JSON.stringify(body);

		expect(serialized).not.toContain(client.clientSecret);
		expect(serialized).not.toContain(expectedHash);
		expect(body.data?.client_secret_hash).toBe('**********');
	});

	test('admin client listing redacts confidential client_secret_hash', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-client-list-secret-hash-callback`,
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const response = await fetch(
			`${baseUrl}/mcp-oauth/clients?filter[client_id][_eq]=${encodeURIComponent(client.clientId)}&fields=client_id,client_secret_hash`,
			{
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			},
		);

		const body = (await expectJsonResponse(response, 200)) as {
			data?: Array<{ client_id?: string; client_secret_hash?: string }>;
		};

		const expectedHash = crypto.createHash('sha256').update(client.clientSecret).digest('hex');
		const serialized = JSON.stringify(body);

		expect(serialized).not.toContain(client.clientSecret);
		expect(serialized).not.toContain(expectedHash);
		expect(body.data).toEqual([{ client_id: client.clientId, client_secret_hash: '**********' }]);
	});

	test('client_secret_hash only allows safe filter operators', async () => {
		const rejectedResponse = await fetch(`${baseUrl}/mcp-oauth/clients?filter[client_secret_hash][_contains]=abc`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		const rejectedBody = (await expectJsonResponse(rejectedResponse, 400)) as {
			errors?: Array<{ extensions?: { code?: string }; message?: string }>;
		};

		expect(rejectedBody.errors?.[0]?.extensions?.code).toBe('INVALID_QUERY');

		expect(rejectedBody.errors?.[0]?.message).toContain(
			'Field with "conceal" special does not allow the "_contains" filter operator',
		);

		await expectJsonResponse(
			await fetch(`${baseUrl}/mcp-oauth/clients?filter[client_secret_hash][_null]=false`, {
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}),
			200,
		);
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
