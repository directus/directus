/**
 * MCP OAuth Settings Gate Tests
 *
 * Tests that endpoints return 403 when mcp_oauth_enabled = false in settings,
 * and accept requests again once re-enabled.
 *
 * These tests require:
 *   MCP_ENABLED=true
 *   MCP_OAUTH_ENABLED=true   (env var gate open; settings gate is what we test here)
 *
 * NOTE: These tests cannot be run locally without Docker Compose + database setup.
 */

import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setMcpOAuthEnabled(baseUrl: string, enabled: boolean): Promise<void> {
	await request(baseUrl)
		.patch('/settings')
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
		.send({ mcp_oauth_enabled: enabled })
		.expect(200);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('/mcp-oauth settings gate', () => {
	// Restore mcp_oauth_enabled=true after each test so other test suites are not affected
	afterEach(async () => {
		// Run for all vendors to ensure clean state
		for (const vendor of vendors) {
			const url = getUrl(vendor);

			await request(url)
				.patch('/settings')
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.send({ mcp_oauth_enabled: true })
				.catch(() => {
					// Best-effort — if the server is down we can't clean up
				});
		}
	});

	describe('mcp_oauth_enabled = false blocks all endpoints', () => {
		it.each(vendors)(
			'%s - POST /mcp-oauth/register returns 403 JSON when disabled',
			async (vendor) => {
				const url = getUrl(vendor);
				await setMcpOAuthEnabled(url, false);

				const res = await request(url)
					.post('/mcp-oauth/register')
					.send({
						client_name: 'test-disabled-client',
						redirect_uris: [`${url}/callback`],
						grant_types: ['authorization_code'],
					});

				expect(res.status).toBe(403);

				expect(res.body).toMatchObject({
					error: 'mcp_oauth_disabled',
				});
			},
			30_000,
		);

		it.each(vendors)(
			'%s - POST /mcp-oauth/token returns 403 JSON when disabled',
			async (vendor) => {
				const url = getUrl(vendor);
				await setMcpOAuthEnabled(url, false);

				const res = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'authorization_code',
						client_id: 'any-client-id',
						code: 'any-code',
						redirect_uri: `${url}/callback`,
						code_verifier: 'any-verifier',
					});

				expect(res.status).toBe(403);

				expect(res.body).toMatchObject({
					error: 'mcp_oauth_disabled',
				});
			},
			30_000,
		);

		it.each(vendors)(
			'%s - POST /mcp-oauth/revoke returns 403 JSON when disabled',
			async (vendor) => {
				const url = getUrl(vendor);
				await setMcpOAuthEnabled(url, false);

				const res = await request(url)
					.post('/mcp-oauth/revoke')
					.type('form')
					.send({ token: 'any-token', client_id: 'any-client-id' });

				expect(res.status).toBe(403);

				expect(res.body).toMatchObject({
					error: 'mcp_oauth_disabled',
				});
			},
			30_000,
		);

		it.each(vendors)(
			'%s - GET /mcp-oauth/authorize returns 403 HTML error page when disabled',
			async (vendor) => {
				const url = getUrl(vendor);
				await setMcpOAuthEnabled(url, false);

				const res = await request(url)
					.get('/mcp-oauth/authorize')
					.query({
						client_id: 'any-client-id',
						redirect_uri: `${url}/callback`,
						response_type: 'code',
						code_challenge: 'any-challenge',
						code_challenge_method: 'S256',
						scope: 'mcp:access',
					});

				expect(res.status).toBe(403);
				expect(res.headers['content-type']).toMatch(/text\/html/);
				expect(res.text).toContain('MCP OAuth is disabled');
			},
			30_000,
		);

		it.each(vendors)(
			'%s - GET /.well-known/oauth-authorization-server returns 403 JSON when disabled',
			async (vendor) => {
				const url = getUrl(vendor);
				await setMcpOAuthEnabled(url, false);

				const res = await request(url).get('/.well-known/oauth-authorization-server');

				expect(res.status).toBe(403);

				expect(res.body).toMatchObject({
					error: 'mcp_oauth_disabled',
				});
			},
			30_000,
		);
	});

	describe('mcp_oauth_enabled = true re-enables endpoints', () => {
		it.each(vendors)(
			'%s - endpoints no longer return 403 after re-enabling',
			async (vendor) => {
				const url = getUrl(vendor);

				// Disable first
				await setMcpOAuthEnabled(url, false);

				// Verify disabled
				const disabledRes = await request(url)
					.post('/mcp-oauth/register')
					.send({
						client_name: 'test-reenable-client',
						redirect_uris: [`${url}/callback`],
						grant_types: ['authorization_code'],
					});

				expect(disabledRes.status).toBe(403);

				// Re-enable
				await setMcpOAuthEnabled(url, true);

				// Now register should succeed (not 403)
				const enabledRes = await request(url)
					.post('/mcp-oauth/register')
					.send({
						client_name: 'test-reenable-client',
						redirect_uris: [`${url}/callback`],
						grant_types: ['authorization_code'],
					});

				expect(enabledRes.status).not.toBe(403);
				expect(enabledRes.status).toBe(201);
			},
			30_000,
		);
	});
});
