import { beforeAll, describe, expect, test } from 'vitest';
import {
	baseUrl,
	createOAuthTokens,
	enableMcpOAuthSettings,
	expectJsonResponse,
	expectTextResponse,
	loginAsAdminSession,
	loginAsAdminToken,
	postJson,
} from '../auth/mcp-oauth-utils.js';

const introspectionQuery = '{ __schema { queryType { name } } }';

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

describe('GraphQL OAuth token isolation', () => {
	test('OAuth bearer token cannot access GraphQL schemas or SDL specs', async () => {
		const { tokens } = await createOAuthTokens();
		const headers = { Authorization: `Bearer ${tokens.access_token}` };

		await expectJsonResponse(await postJson('/graphql', { query: introspectionQuery }, { headers }), 403);
		await expectJsonResponse(await postJson('/graphql/system', { query: introspectionQuery }, { headers }), 403);
		await expectJsonResponse(await fetch(`${baseUrl}/server/specs/graphql`, { headers }), 403);
		await expectJsonResponse(await fetch(`${baseUrl}/server/specs/graphql/system`, { headers }), 403);
	});

	test('OAuth query token cannot access GraphQL or SDL specs', async () => {
		const { tokens } = await createOAuthTokens();
		const token = encodeURIComponent(tokens.access_token);

		await expectJsonResponse(await postJson(`/graphql?access_token=${token}`, { query: introspectionQuery }), 403);
		await expectJsonResponse(await fetch(`${baseUrl}/server/specs/graphql?access_token=${token}`), 403);
	});
});

describe('GraphQL regular Directus auth', () => {
	test('static token still works when a session cookie is present', async () => {
		const cookies = await loginAsAdminSession();

		const response = await postJson(
			'/graphql',
			{ query: '{ __typename }' },
			{
				headers: {
					Authorization: 'Bearer admin',
					Cookie: cookies,
				},
			},
		);

		const body = (await expectJsonResponse(response, 200)) as { data?: { __typename?: string } };

		expect(body.data?.__typename).toBe('Query');

		const schemaResponse = await fetch(`${baseUrl}/server/specs/graphql?access_token=admin`, {
			headers: { Cookie: cookies },
		});

		const schema = await expectTextResponse(schemaResponse, 200);

		expect(schema).toContain('type Query');
	});

	test('regular Directus session and login tokens can access GraphQL', async () => {
		const cookies = await loginAsAdminSession();
		const accessToken = await loginAsAdminToken();

		const sessionResponse = await postJson(
			'/graphql/system',
			{ query: introspectionQuery },
			{ headers: { Cookie: cookies } },
		);

		const tokenResponse = await postJson(
			'/graphql',
			{ query: '{ __typename }' },
			{ headers: { Authorization: `Bearer ${accessToken}` } },
		);

		await expectJsonResponse(sessionResponse, 200);
		await expectJsonResponse(tokenResponse, 200);
	});
});
