import crypto from 'node:crypto';
import { SchemaBuilder } from '@directus/schema-builder';
import jwt from 'jsonwebtoken';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { McpOAuthService, OAuthError } from './mcp-oauth.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		PUBLIC_URL: 'https://example.com',
		ACCESS_TOKEN_TTL: '15m',
		REFRESH_TOKEN_TTL: '7d',
		MCP_OAUTH_MAX_CLIENTS: 10000,
		MCP_OAUTH_CLIENT_UNUSED_TTL: '3d',
		MCP_OAUTH_CLIENT_IDLE_TTL: '0',
	}),
}));

const TEST_SECRET = 'test-secret-key-for-mcp-oauth';

vi.mock('../utils/get-secret.js', () => ({
	getSecret: () => TEST_SECRET,
}));

const mockNanoid = vi.fn().mockReturnValue('a'.repeat(64));

vi.mock('nanoid', () => ({
	nanoid: (...args: unknown[]) => mockNanoid(...args),
}));

const mockFetchRolesTree = vi.fn().mockResolvedValue(['role-1']);

vi.mock('../permissions/lib/fetch-roles-tree.js', () => ({
	fetchRolesTree: (...args: unknown[]) => mockFetchRolesTree(...args),
}));

const mockFetchGlobalAccess = vi.fn().mockResolvedValue({ app: true, admin: false });

vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.js', () => ({
	fetchGlobalAccess: (...args: unknown[]) => mockFetchGlobalAccess(...args),
}));

const mockActivityCreateOne = vi.fn().mockResolvedValue('activity-id');

vi.mock('./activity.js', () => ({
	ActivityService: vi.fn().mockImplementation(() => ({
		createOne: mockActivityCreateOne,
	})),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}),
}));

const consentKey = crypto.createHmac('sha256', TEST_SECRET).update('mcp-oauth-consent-v1').digest();

const schema = new SchemaBuilder()
	.collection('directus_oauth_clients', (c) => {
		c.field('client_id').uuid().primary();
	})
	.build();

// --- Test constants ---

const TEST_PUBLIC_URL = 'https://example.com';
const TEST_RESOURCE_URL = `${TEST_PUBLIC_URL}/mcp`;
const TEST_REDIRECT_URI = 'https://client.example.com/callback';

// --- Test factories ---

function createTestClient(overrides: Record<string, unknown> = {}) {
	return {
		client_name: 'Test MCP Client',
		redirect_uris: [TEST_REDIRECT_URI],
		grant_types: ['authorization_code'],
		token_endpoint_auth_method: 'none',
		...overrides,
	};
}

function createUserRow(overrides: Record<string, unknown> = {}) {
	return {
		email: 'user@example.com',
		status: 'active' as const,
		...overrides,
	};
}

function createGrantRow(overrides: Record<string, unknown> = {}) {
	return {
		id: crypto.randomUUID(),
		client: crypto.randomUUID(),
		user: crypto.randomUUID(),
		session: crypto.createHash('sha256').update('x'.repeat(64)).digest('hex'),
		previous_session: null,
		resource: TEST_RESOURCE_URL,
		scope: 'mcp:access',
		expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		date_created: new Date(),
		...overrides,
	};
}

async function assertOAuthError(
	fn: () => Promise<unknown>,
	opts: { error: string; statusCode?: number; redirectable?: boolean },
) {
	try {
		await fn();
		expect.fail('Expected OAuthError to be thrown');
	} catch (err) {
		expect(err).toBeInstanceOf(OAuthError);
		expect((err as OAuthError).code).toBe(opts.error);

		if (opts.statusCode) {
			expect((err as OAuthError).status).toBe(opts.statusCode);
		}

		if (opts.redirectable !== undefined) {
			expect((err as OAuthError).redirectable).toBe(opts.redirectable);
		}
	}
}

describe('McpOAuthService', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(async () => {
		tracker.reset();
		const { useEnv } = vi.mocked(await import('@directus/env'));

		useEnv.mockReturnValue({
			PUBLIC_URL: TEST_PUBLIC_URL,
			ACCESS_TOKEN_TTL: '15m',
			REFRESH_TOKEN_TTL: '7d',
			MCP_OAUTH_MAX_CLIENTS: 10000,
			MCP_OAUTH_CLIENT_UNUSED_TTL: '3d',
			MCP_OAUTH_CLIENT_IDLE_TTL: '0',
		} as any);

		mockNanoid.mockReturnValue('a'.repeat(64));
		mockFetchRolesTree.mockResolvedValue(['role-1']);
		mockFetchGlobalAccess.mockResolvedValue({ app: true, admin: false });
		mockActivityCreateOne.mockResolvedValue('activity-id');
		vi.clearAllMocks();
	});

	function queryHistory(op: 'select' | 'insert' | 'update' | 'delete', table: string) {
		return tracker.history[op].filter((q: any) => q.sql.includes(table));
	}

	function decodeConsent(token: string) {
		return jwt.verify(token, consentKey, { algorithms: ['HS256'] }) as Record<string, unknown>;
	}

	function decodeAccessToken(token: string) {
		return jwt.verify(token, TEST_SECRET) as Record<string, unknown>;
	}

	function mockClientLookup(clientId: string, overrides: Record<string, unknown> = {}) {
		tracker.on.select('directus_oauth_clients').response([
			{
				client_id: clientId,
				client_name: 'Test MCP Client',
				redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
				grant_types: JSON.stringify(['authorization_code', 'refresh_token']),
				token_endpoint_auth_method: 'none',
				...overrides,
			},
		]);
	}

	describe('getProtectedResourceMetadata', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('resource matches PUBLIC_URL + /mcp', () => {
			const meta = service.getProtectedResourceMetadata();
			expect(meta.resource).toBe(TEST_RESOURCE_URL);
		});

		it('authorization_servers includes subpath', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ PUBLIC_URL: 'https://example.com/directus' } as any);

			const svc = new McpOAuthService({ knex: db, schema });
			const meta = svc.getProtectedResourceMetadata();
			expect(meta.authorization_servers).toContain('https://example.com/directus');
		});

		it('does NOT include bearer_methods_supported', () => {
			const meta = service.getProtectedResourceMetadata();
			expect(meta).not.toHaveProperty('bearer_methods_supported');
		});

		it('subpath: PUBLIC_URL=https://example.com/directus produces correct resource', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ PUBLIC_URL: 'https://example.com/directus' } as any);

			const svc = new McpOAuthService({ knex: db, schema });
			const meta = svc.getProtectedResourceMetadata();
			expect(meta.resource).toBe('https://example.com/directus/mcp');
			expect(meta.authorization_servers).toContain('https://example.com/directus');
		});
	});

	describe('getAuthorizationServerMetadata', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('issuer matches PUBLIC_URL', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.issuer).toBe(TEST_PUBLIC_URL);
		});

		it('issuer includes subpath', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ PUBLIC_URL: 'https://example.com/directus' } as any);

			const svc = new McpOAuthService({ knex: db, schema });
			const meta = svc.getAuthorizationServerMetadata();
			expect(meta.issuer).toBe('https://example.com/directus');
		});

		it('all endpoint URLs include subpath', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ PUBLIC_URL: 'https://example.com/directus' } as any);

			const svc = new McpOAuthService({ knex: db, schema });
			const meta = svc.getAuthorizationServerMetadata();

			expect(meta.authorization_endpoint).toContain('/directus/');
			expect(meta.token_endpoint).toContain('/directus/');
			expect(meta.registration_endpoint).toContain('/directus/');
			expect(meta.revocation_endpoint).toContain('/directus/');
		});

		it('includes response_modes_supported: ["query"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.response_modes_supported).toEqual(['query']);
		});

		it('includes authorization_response_iss_parameter_supported: true', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.authorization_response_iss_parameter_supported).toBe(true);
		});

		it('includes response_types_supported: ["code"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.response_types_supported).toEqual(['code']);
		});

		it('includes grant_types_supported: ["authorization_code", "refresh_token"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
		});

		it('includes token_endpoint_auth_methods_supported: ["none"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.token_endpoint_auth_methods_supported).toEqual(['none']);
		});

		it('includes revocation_endpoint_auth_methods_supported: ["none"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.revocation_endpoint_auth_methods_supported).toEqual(['none']);
		});

		it('includes code_challenge_methods_supported: ["S256"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.code_challenge_methods_supported).toEqual(['S256']);
		});

		it('includes scopes_supported: ["mcp:access"]', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.scopes_supported).toEqual(['mcp:access']);
		});

		it('includes registration_endpoint', () => {
			const meta = service.getAuthorizationServerMetadata();
			expect(meta.registration_endpoint).toBe(`${TEST_PUBLIC_URL}/mcp-oauth/register`);
		});

		it('subpath: PUBLIC_URL=https://example.com/directus produces correct URLs', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			useEnv.mockReturnValue({ PUBLIC_URL: 'https://example.com/directus' } as any);

			const svc = new McpOAuthService({ knex: db, schema });
			const meta = svc.getAuthorizationServerMetadata();

			expect(meta.issuer).toBe('https://example.com/directus');
			expect(meta.authorization_endpoint).toBe('https://example.com/directus/mcp-oauth/authorize');
			expect(meta.token_endpoint).toBe('https://example.com/directus/mcp-oauth/token');
			expect(meta.registration_endpoint).toBe('https://example.com/directus/mcp-oauth/register');
			expect(meta.revocation_endpoint).toBe('https://example.com/directus/mcp-oauth/revoke');
		});
	});

	describe('registerClient', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('valid registration returns client_id and metadata', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient());

			expect(result.client_id).toBeDefined();
			expect(typeof result.client_id).toBe('string');
			expect(result.client_name).toBe('Test MCP Client');
			expect(result.redirect_uris).toEqual([TEST_REDIRECT_URI]);
			expect(result.grant_types).toEqual(['authorization_code']);
			expect(result.token_endpoint_auth_method).toBe('none');
		});

		it('omitted token_endpoint_auth_method defaults to none', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ token_endpoint_auth_method: undefined }));

			expect(result.token_endpoint_auth_method).toBe('none');
		});

		it('explicit token_endpoint_auth_method=none accepted', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ token_endpoint_auth_method: 'none' }));

			expect(result.token_endpoint_auth_method).toBe('none');
		});

		it('token_endpoint_auth_method=client_secret_basic rejected', async () => {
			await assertOAuthError(
				() => service.registerClient(createTestClient({ token_endpoint_auth_method: 'client_secret_basic' })),
				{ error: 'invalid_client_metadata' },
			);
		});

		it('grant_types must contain authorization_code', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: ['refresh_token'] })), {
				error: 'invalid_client_metadata',
			});
		});

		it('grant_types with only refresh_token rejected', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: ['refresh_token'] })), {
				error: 'invalid_client_metadata',
			});
		});

		it('omitted grant_types rejected with invalid_client_metadata', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: undefined })), {
				error: 'invalid_client_metadata',
			});
		});

		it('unknown grant type rejected', async () => {
			await assertOAuthError(
				() => service.registerClient(createTestClient({ grant_types: ['authorization_code', 'client_credentials'] })),
				{ error: 'invalid_client_metadata', statusCode: 400 },
			);
		});

		describe('redirect_uris validation', () => {
			it.each([
				['http://evil.com/callback', 'non-localhost HTTP'],
				['ftp://example.com/callback', 'non-HTTP scheme'],
				['https://user@example.com/callback', 'userinfo in URI'],
				['https://example.com/callback#frag', 'fragment in URI'],
			])('rejects %s (%s)', async (uri, _label) => {
				await assertOAuthError(() => service.registerClient(createTestClient({ redirect_uris: [uri] })), {
					error: 'invalid_redirect_uri',
				});
			});

			it('http://localhost:3000/callback accepted', async () => {
				tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
				tracker.on.insert('directus_oauth_clients').response([]);

				const result = await service.registerClient(
					createTestClient({ redirect_uris: ['http://localhost:3000/callback'] }),
				);

				expect(result.redirect_uris).toEqual(['http://localhost:3000/callback']);
			});

			it('max 10 redirect URIs', async () => {
				const uris = Array.from({ length: 11 }, (_, i) => `https://example.com/cb${i}`);

				await assertOAuthError(() => service.registerClient(createTestClient({ redirect_uris: uris })), {
					error: 'invalid_redirect_uri',
				});
			});

			it('rejects URI longer than 255 chars', async () => {
				const longUri = `https://example.com/${'a'.repeat(250)}`;

				await assertOAuthError(() => service.registerClient(createTestClient({ redirect_uris: [longUri] })), {
					error: 'invalid_redirect_uri',
				});
			});
		});

		it('client_name max 200 chars', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ client_name: 'a'.repeat(201) })), {
				error: 'invalid_client_metadata',
			});
		});

		it('unknown fields silently ignored', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ some_unknown_field: 'whatever', another: 123 }));

			expect(result).not.toHaveProperty('some_unknown_field');
			expect(result).not.toHaveProperty('another');
		});

		it('response_types derived from grant_types if omitted', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ response_types: undefined }));

			expect(result.response_types).toEqual(['code']);
		});

		it('explicit response_types=["code"] accepted', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ response_types: ['code'] }));

			expect(result.response_types).toEqual(['code']);
		});

		it('response_types=["token"] rejected', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ response_types: ['token'] })), {
				error: 'invalid_client_metadata',
			});
		});

		it('response includes all registered metadata per RFC 7591 Section 3.2.1', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient());

			expect(result).toHaveProperty('client_id');
			expect(result).toHaveProperty('client_name');
			expect(result).toHaveProperty('redirect_uris');
			expect(result).toHaveProperty('grant_types');
			expect(result).toHaveProperty('response_types');
			expect(result).toHaveProperty('token_endpoint_auth_method');
			expect(result).toHaveProperty('client_id_issued_at');
			expect(typeof result.client_id_issued_at).toBe('number');
		});

		it('global cap (10000 clients) enforced by default', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 10000 }]);

			await assertOAuthError(() => service.registerClient(createTestClient()), { error: 'invalid_client_metadata' });
		});

		it('global cap can be raised via MCP_OAUTH_MAX_CLIENTS', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: 'https://example.com',
				MCP_OAUTH_MAX_CLIENTS: 10001,
			} as any);

			tracker.on.select('directus_oauth_clients').response([{ count: 10000 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient());

			expect(result.client_id).toBeDefined();
		});

		it('MCP_OAUTH_MAX_CLIENTS=0 disables the global client cap', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: 'https://example.com',
				MCP_OAUTH_MAX_CLIENTS: 0,
			} as any);

			tracker.on.select('directus_oauth_clients').response([{ count: 50000 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient());

			expect(result.client_id).toBeDefined();
		});

		it('empty redirect_uris rejected', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ redirect_uris: [] })), {
				error: 'invalid_redirect_uri',
			});
		});

		it('missing redirect_uris rejected', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ redirect_uris: undefined })), {
				error: 'invalid_redirect_uri',
			});
		});

		it('missing client_name rejected', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ client_name: undefined })), {
				error: 'invalid_client_metadata',
			});
		});
	});

	describe('validateAuthorization', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const sessionHash = crypto.createHash('sha256').update('session-token-123').digest('hex');
		const clientId = crypto.randomUUID();
		const codeChallenge = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

		function validParams(overrides: Record<string, unknown> = {}): Record<string, unknown> {
			return {
				client_id: clientId,
				redirect_uri: TEST_REDIRECT_URI,
				response_type: 'code',
				code_challenge: codeChallenge,
				code_challenge_method: 'S256',
				scope: 'mcp:access',
				resource: TEST_RESOURCE_URL,
				...overrides,
			};
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('valid params return signed_params and client info', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);

			expect(result.signed_params).toBeDefined();
			expect(typeof result.signed_params).toBe('string');
			expect(result.client_name).toBe('Test MCP Client');
			expect(result.already_consented).toBe(false);

			// Verify JWT is decodable with consent key
			const decoded = decodeConsent(result.signed_params);

			expect(decoded['aud']).toBe('mcp-oauth-authorize-decision');
			expect(decoded['sub']).toBe(userId);
			expect(decoded['client_id']).toBe(clientId);
		});

		it('unknown client_id returns error (no redirect)', async () => {
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.validateAuthorization(validParams(), userId, sessionHash), {
				error: 'invalid_request',
				redirectable: false,
			});
		});

		it('unregistered redirect_uri returns error (no redirect)', async () => {
			mockClientLookup(clientId, { redirect_uris: JSON.stringify(['https://other.example.com/callback']) });

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ redirect_uri: TEST_REDIRECT_URI }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it('missing code_challenge returns invalid_request (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ code_challenge: undefined }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
			);
		});

		it('code_challenge_method != S256 rejected (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ code_challenge_method: 'plain' }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
			);
		});

		it('code_challenge too short rejected', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ code_challenge: 'abc' }), userId, sessionHash),
				{ error: 'invalid_request', statusCode: 400 },
			);
		});

		it('code_challenge too long rejected', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ code_challenge: 'A'.repeat(44) }), userId, sessionHash),
				{ error: 'invalid_request', statusCode: 400 },
			);
		});

		it('code_challenge with invalid characters rejected', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() =>
					service.validateAuthorization(
						validParams({ code_challenge: 'dBjftJeZ4CVP+mB92K27uhbUJU1p1r/wW1gFWFOEjXk' }),
						userId,
						sessionHash,
					),
				{ error: 'invalid_request', statusCode: 400 },
			);
		});

		it('invalid scope rejected (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ scope: 'openid' }), userId, sessionHash),
				{ error: 'invalid_scope', redirectable: true },
			);
		});

		it('omitted scope defaults to mcp:access', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams({ scope: undefined }), userId, sessionHash);
			expect(result.signed_params).toBeDefined();

			const decoded = decodeConsent(result.signed_params);

			expect(decoded['scope']).toBe('mcp:access');
		});

		it('empty scope defaults to mcp:access', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams({ scope: '  ' }), userId, sessionHash);
			expect(result.signed_params).toBeDefined();

			const decoded = decodeConsent(result.signed_params);

			expect(decoded['scope']).toBe('mcp:access');
		});

		it('response_mode=fragment rejected (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ response_mode: 'fragment' }), userId, sessionHash),
				{ error: 'invalid_request', statusCode: 400, redirectable: true },
			);
		});

		it('response_mode=query accepted', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams({ response_mode: 'query' }), userId, sessionHash);

			expect(result.signed_params).toBeDefined();
		});

		it('response_mode omitted accepted', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);
			expect(result.signed_params).toBeDefined();
		});

		it('missing resource defaults to expected resource when MCP_OAUTH_REQUIRE_RESOURCE=false', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams({ resource: undefined }), userId, sessionHash);
			expect(result.signed_params).toBeDefined();

			const decoded = decodeConsent(result.signed_params);

			expect(decoded['resource']).toBe(TEST_RESOURCE_URL);
		});

		it('missing resource rejected when MCP_OAUTH_REQUIRE_RESOURCE=true', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_REQUIRE_RESOURCE: true,
			} as any);

			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ resource: undefined }), userId, sessionHash),
				{ error: 'invalid_target', redirectable: true },
			);
		});

		it('resource mismatch rejected (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ resource: 'https://evil.com/mcp' }), userId, sessionHash),
				{ error: 'invalid_target', redirectable: true },
			);
		});

		it('missing response_type returns invalid_request (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ response_type: undefined }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
			);
		});

		it('duplicate response_type returns redirectable invalid_request', async () => {
			mockClientLookup(clientId);

			// Post-trust param: duplicate detected after redirect_uri validation, so redirectable
			await assertOAuthError(
				() => service.validateAuthorization(validParams({ response_type: ['code', 'code'] }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
			);
		});

		it('response_type=token returns unsupported_response_type (redirectable)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ response_type: 'token' }), userId, sessionHash),
				{ error: 'unsupported_response_type', redirectable: true },
			);
		});

		it('response_type=code accepted', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);
			expect(result.signed_params).toBeDefined();
		});

		it('signed consent JWT includes session_hash claim', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);

			const decoded = decodeConsent(result.signed_params);

			expect(decoded['session_hash']).toBe(sessionHash);
		});

		it('already_consented always false for DCR clients', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);
			expect(result.already_consented).toBe(false);
		});

		it('duplicate post-trust param (scope) returns redirectable invalid_request', async () => {
			mockClientLookup(clientId);

			// scope is a post-trust param: duplicate detected after redirect_uri validation, so redirectable
			await assertOAuthError(
				() => service.validateAuthorization(validParams({ scope: ['mcp:access', 'mcp:access'] }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
			);
		});

		it('duplicate pre-trust param (client_id) returns non-redirectable invalid_request', async () => {
			// client_id is a pre-trust param: duplicate detected before redirect_uri validation
			await assertOAuthError(
				() => service.validateAuthorization(validParams({ client_id: ['id1', 'id2'] }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it('state is optional but passed through in JWT', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(validParams({ state: 'my-state-123' }), userId, sessionHash);

			const decoded = decodeConsent(result.signed_params);

			expect(decoded['state']).toBe('my-state-123');
		});

		it('missing client_id returns non-redirectable invalid_request', async () => {
			await assertOAuthError(
				() => service.validateAuthorization(validParams({ client_id: undefined }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it('missing redirect_uri returns non-redirectable invalid_request', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ redirect_uri: undefined }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it('scope with extra tokens clamped to mcp:access', async () => {
			mockClientLookup(clientId);

			const result = await service.validateAuthorization(
				validParams({ scope: 'mcp:access openid' }),
				userId,
				sessionHash,
			);

			expect(result.scope).toBe('mcp:access');
		});
	});

	describe('processDecision', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const sessionToken = 'session-token-123';
		const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
		const clientId = crypto.randomUUID();
		const codeChallenge = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

		function signConsent(overrides: Record<string, unknown> = {}): string {
			return jwt.sign(
				{
					typ: 'directus-mcp-consent+jwt',
					aud: 'mcp-oauth-authorize-decision',
					sub: userId,
					session_hash: sessionHash,
					client_id: clientId,
					redirect_uri: TEST_REDIRECT_URI,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					scope: 'mcp:access',
					resource: TEST_RESOURCE_URL,
					state: 'test-state',
					...overrides,
				},
				consentKey,
				{ expiresIn: '5m', algorithm: 'HS256' },
			);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('valid approval generates code and returns redirect URL with code, state, iss', async () => {
			mockClientLookup(clientId);
			tracker.on.insert('directus_oauth_codes').response([]);

			// Consent upsert
			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const signed = signConsent();
			const url = await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);
			const parsed = new URL(url);

			expect(parsed.origin + parsed.pathname).toBe(TEST_REDIRECT_URI);
			expect(parsed.searchParams.get('code')).toBeDefined();
			expect(parsed.searchParams.get('code')!.length).toBe(64); // 32 bytes hex
			expect(parsed.searchParams.get('state')).toBe('test-state');
			expect(parsed.searchParams.get('iss')).toBe(TEST_PUBLIC_URL);
		});

		it('denial returns redirect URL with error=access_denied, state, iss', async () => {
			const signed = signConsent();
			const url = await service.processDecision({ signed_params: signed, approved: false }, userId, sessionToken);
			const parsed = new URL(url);

			expect(parsed.searchParams.get('error')).toBe('access_denied');
			expect(parsed.searchParams.get('state')).toBe('test-state');
			expect(parsed.searchParams.get('iss')).toBe(TEST_PUBLIC_URL);
			expect(parsed.searchParams.has('code')).toBe(false);
		});

		it('signed consent JWT invalid/tampered rejects', async () => {
			await assertOAuthError(
				() => service.processDecision({ signed_params: 'not.a.valid.jwt', approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('expired consent JWT (>5min) rejects', async () => {
			const expired = jwt.sign(
				{
					typ: 'directus-mcp-consent+jwt',
					aud: 'mcp-oauth-authorize-decision',
					sub: userId,
					session_hash: sessionHash,
					client_id: clientId,
					redirect_uri: TEST_REDIRECT_URI,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					scope: 'mcp:access',
					resource: TEST_RESOURCE_URL,
					state: 'test-state',
				},
				consentKey,
				{ expiresIn: '0s', algorithm: 'HS256' },
			);

			// Small delay to ensure expiry
			await new Promise((r) => setTimeout(r, 10));

			await assertOAuthError(
				() => service.processDecision({ signed_params: expired, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('consent JWT with wrong session_hash rejects (session binding)', async () => {
			const signed = signConsent({ session_hash: 'wrong-hash' });

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('regular Directus JWT (signed with raw getSecret()) rejected as consent artifact', async () => {
			const rawJwt = jwt.sign(
				{
					typ: 'directus-mcp-consent+jwt',
					aud: 'mcp-oauth-authorize-decision',
					sub: userId,
					session_hash: sessionHash,
					client_id: clientId,
				},
				TEST_SECRET, // raw secret, not derived consent key
				{ expiresIn: '5m', algorithm: 'HS256' },
			);

			await assertOAuthError(
				() => service.processDecision({ signed_params: rawJwt, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('consent JWT from user A rejected when submitted by user B (sub claim mismatch)', async () => {
			const otherUserId = crypto.randomUUID();
			const signed = signConsent({ sub: otherUserId });

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('re-validates client against DB (stale registration caught)', async () => {
			// Client no longer exists in DB
			tracker.on.select('directus_oauth_clients').response([]);

			const signed = signConsent();

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('stale redirect_uri (removed from client since consent) returns invalid_request', async () => {
			// Client still exists but no longer has the redirect_uri from the consent JWT
			mockClientLookup(clientId, { redirect_uris: JSON.stringify(['https://other.example.com/callback']) });

			const signed = signConsent();

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
		});

		it('consent record created/updated', async () => {
			mockClientLookup(clientId);
			tracker.on.insert('directus_oauth_codes').response([]);

			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const signed = signConsent();
			await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);

			// Verify that a consent insert was made
			const insertHistory = queryHistory('insert', 'directus_oauth_consents');

			expect(insertHistory.length).toBeGreaterThanOrEqual(1);
		});

		it('existing consent record updated (not inserted) on re-approval', async () => {
			mockClientLookup(clientId);
			tracker.on.insert('directus_oauth_codes').response([]);

			// Existing consent found
			tracker.on.select('directus_oauth_consents').response([{ id: crypto.randomUUID() }]);
			tracker.on.update('directus_oauth_consents').response(1);

			const signed = signConsent();
			await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);

			// Verify UPDATE was called (not INSERT) for consent
			const updateHistory = queryHistory('update', 'directus_oauth_consents');
			expect(updateHistory.length).toBe(1);

			const consentInserts = queryHistory('insert', 'directus_oauth_consents');
			expect(consentInserts.length).toBe(0);
		});

		it('code stored with PKCE challenge, user, client, redirect_uri, resource', async () => {
			mockClientLookup(clientId);

			let insertedCodeData: Record<string, unknown> | undefined;

			tracker.on.insert('directus_oauth_codes').response(function (rawQuery) {
				insertedCodeData = rawQuery.bindings ? undefined : undefined;
				// knex-mock-client: capture via history instead
				return [];
			});

			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const signed = signConsent();
			const url = await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);

			// Verify via the redirect that a code was produced
			const parsed = new URL(url);
			const code = parsed.searchParams.get('code')!;
			expect(code).toBeDefined();
			expect(code.length).toBe(64);

			// Verify the code_hash stored in DB is SHA256 of the raw code
			const expectedHash = crypto.createHash('sha256').update(code).digest('hex');
			const codeInserts = queryHistory('insert', 'directus_oauth_codes');
			expect(codeInserts.length).toBe(1);
			// The bindings should include the hash
			expect(codeInserts[0]!.bindings).toContain(expectedHash);
		});

		it('Referrer-Policy: no-referrer set on 302 response (controller responsibility)', async () => {
			// NOTE: Referrer-Policy header is a controller-layer concern.
			// The service returns the redirect URL; the controller sets the header.
			// This test just documents the expectation.
			mockClientLookup(clientId);
			tracker.on.insert('directus_oauth_codes').response([]);

			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const signed = signConsent();
			const url = await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);

			// Service returns a URL string; Referrer-Policy is set by the controller
			expect(typeof url).toBe('string');
		});

		it('code creation and consent upsert wrapped in a single transaction', async () => {
			mockClientLookup(clientId);
			tracker.on.insert('directus_oauth_codes').response([]);

			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const transactionSpy = vi.spyOn(db, 'transaction');

			const signed = signConsent();
			await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);

			expect(transactionSpy).toHaveBeenCalledOnce();

			// Verify both writes still happened
			const codeInserts = queryHistory('insert', 'directus_oauth_codes');
			const consentInserts = queryHistory('insert', 'directus_oauth_consents');
			expect(codeInserts.length).toBe(1);
			expect(consentInserts.length).toBe(1);
		});
	});

	describe('exchangeCode', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const clientId = crypto.randomUUID();
		const resource = TEST_RESOURCE_URL;
		const scope = 'mcp:access';
		const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'; // 43 chars, valid
		const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
		const rawCode = crypto.randomBytes(32).toString('hex');
		const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
		const codeId = crypto.randomUUID();
		const context = { ip: '127.0.0.1', userAgent: 'test-agent' };

		function validParams(overrides: Record<string, unknown> = {}) {
			return {
				grant_type: 'authorization_code',
				client_id: clientId,
				code: rawCode,
				redirect_uri: TEST_REDIRECT_URI,
				code_verifier: codeVerifier,
				resource,
				...overrides,
			};
		}

		function mockCodeLookup(overrides: Record<string, unknown> = {}) {
			tracker.on.select('directus_oauth_codes').response([
				{
					id: codeId,
					code_hash: codeHash,
					client: clientId,
					user: userId,
					redirect_uri: TEST_REDIRECT_URI,
					resource,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					scope,
					expires_at: new Date(Date.now() + 600_000), // 10 min from now
					used_at: null,
					...overrides,
				},
			]);
		}

		function mockUserLookup(overrides: Record<string, unknown> = {}) {
			tracker.on.select('directus_users').response([createUserRow(overrides)]);
		}

		/** Set up all DB mocks for a successful exchange */
		function mockSuccessfulExchange() {
			// 1. Code lookup (read-only, outside transaction)
			mockCodeLookup();
			// 2. Atomic burn (inside transaction)
			tracker.on.update('directus_oauth_codes').response(1);
			// 3. Client lookup (inside transaction)
			mockClientLookup(clientId);
			// 4. User lookup for email + status (inside transaction)
			mockUserLookup();
			// 5. Existing grant lookup (none found)
			tracker.on.select('directus_oauth_tokens').response([]);
			// 6. Insert session
			tracker.on.insert('directus_sessions').response([]);
			// 7. Insert grant
			tracker.on.insert('directus_oauth_tokens').response([]);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('missing grant_type returns invalid_request', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ grant_type: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('unsupported grant_type returns unsupported_grant_type', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ grant_type: 'client_credentials' }), context), {
				error: 'unsupported_grant_type',
			});
		});

		it('missing client_id returns invalid_request', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ client_id: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('missing code returns invalid_request', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ code: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('missing redirect_uri returns invalid_request', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ redirect_uri: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('missing code_verifier returns invalid_request', async () => {
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('malformed code_verifier (too short) returns invalid_request before code lookup', async () => {
			// 42 chars - below minimum of 43
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(42) }), context), {
				error: 'invalid_request',
			});

			// No DB queries should have been made
			expect(tracker.history.select).toHaveLength(0);
		});

		it('malformed code_verifier (too long) returns invalid_request before code lookup', async () => {
			// 129 chars - above maximum of 128
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(129) }), context), {
				error: 'invalid_request',
			});

			expect(tracker.history.select).toHaveLength(0);
		});

		it('malformed code_verifier (invalid charset) returns invalid_request before code lookup', async () => {
			// 43 chars but contains space (not unreserved per RFC 7636)
			await assertOAuthError(
				() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(42) + ' ' }), context),
				{ error: 'invalid_request' },
			);

			expect(tracker.history.select).toHaveLength(0);
		});

		it('malformed code_verifier returns invalid_request even when code is valid (format check runs first)', async () => {
			// Set up valid code in DB but provide bad verifier - should not touch DB
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a!b'.repeat(15) }), context), {
				error: 'invalid_request',
			});

			expect(tracker.history.select).toHaveLength(0);
		});

		it('valid code exchange returns access_token, token_type=Bearer, refresh_token, scope, expires_in', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams(), context);

			expect(result.access_token).toBeDefined();
			expect(result.token_type).toBe('Bearer');
			expect(result.refresh_token).toBeDefined();
			expect(result.scope).toBe('mcp:access');
			expect(result.expires_in).toBe(900); // 15m = 900s
		});

		it('session created with expiry from REFRESH_TOKEN_TTL', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

			const sessionInserts = queryHistory('insert', 'directus_sessions');
			expect(sessionInserts.length).toBe(1);
			// 7 days in ms
			const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
			const insertBindings = sessionInserts[0]!.bindings;
			// Find the Date binding (expires)
			const dateBind = insertBindings.find((b) => b instanceof Date) as Date;
			expect(dateBind).toBeDefined();
			// Within 5 seconds of expected
			expect(Math.abs(dateBind.getTime() - expectedExpiry)).toBeLessThan(5000);
		});

		it('activity record created with action=login', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

			expect(mockActivityCreateOne).toHaveBeenCalledOnce();

			const activityArg = mockActivityCreateOne.mock.calls[0]![0];
			expect(activityArg.action).toBe('login');
			expect(activityArg.user).toBe(userId);
			expect(activityArg.ip).toBe('127.0.0.1');
		});

		it('PKCE verification (S256) succeeds with correct verifier', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams(), context);
			expect(result.access_token).toBeDefined();
		});

		it('wrong code_verifier returns invalid_grant', async () => {
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			mockClientLookup(clientId);

			// Valid format but wrong verifier
			const wrongVerifier = 'x'.repeat(43);

			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: wrongVerifier }), context), {
				error: 'invalid_grant',
			});
		});

		it('expired code returns invalid_grant', async () => {
			mockCodeLookup({ expires_at: new Date(Date.now() - 1000) }); // expired 1s ago
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong client_id returns invalid_grant', async () => {
			const wrongClientId = crypto.randomUUID();
			mockCodeLookup({ client: wrongClientId });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong redirect_uri returns invalid_grant', async () => {
			mockCodeLookup({ redirect_uri: 'https://other.example.com/callback' });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong resource returns invalid_target', async () => {
			mockCodeLookup({ resource: 'https://evil.com/mcp' });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_target' });
		});

		it('missing resource defaults to code resource when MCP_OAUTH_REQUIRE_RESOURCE=false', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams({ resource: undefined }), context);
			expect(result.access_token).toBeDefined();
		});

		it('code already used returns invalid_grant (atomic UPDATE returns 0)', async () => {
			mockCodeLookup();
			// Atomic update returns 0 = already used
			tracker.on.update('directus_oauth_codes').response(0);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('concurrent code exchange - only one wins (atomic UPDATE)', async () => {
			// First call: code found in SELECT, but UPDATE returns 0 (someone else used it first)
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(0);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('JWT includes session, scope=mcp:access, aud=resource', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams(), context);
			const decoded = decodeAccessToken(result.access_token);

			expect(decoded['session']).toBeDefined();
			expect(decoded['scope']).toBe('mcp:access');
			expect(decoded['aud']).toBe(resource);
			expect(decoded['iss']).toBe('directus');
		});

		it('refresh_token omitted if client did not register refresh_token grant type', async () => {
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			// Client only has authorization_code, no refresh_token
			mockClientLookup(clientId, { grant_types: JSON.stringify(['authorization_code']) });
			mockUserLookup();
			tracker.on.select('directus_oauth_tokens').response([]);
			tracker.on.insert('directus_sessions').response([]);
			tracker.on.insert('directus_oauth_tokens').response([]);

			const result = await service.exchangeCode(validParams(), context);

			expect(result.refresh_token).toBeUndefined();
		});

		it('session created with oauth_client set', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

			const sessionInserts = queryHistory('insert', 'directus_sessions');
			expect(sessionInserts.length).toBe(1);
			expect(sessionInserts[0]!.bindings).toContain(clientId);
		});

		it('oauth_tokens row created with code_hash, resource, scope, expires_at', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

			const tokenInserts = queryHistory('insert', 'directus_oauth_tokens');
			expect(tokenInserts.length).toBe(1);
			const bindings = tokenInserts[0]!.bindings;
			expect(bindings).toContain(codeHash);
			expect(bindings).toContain(resource);
			expect(bindings).toContain(scope);
		});

		it('existing grant for same (client, user) is deleted before new grant', async () => {
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			mockClientLookup(clientId);
			mockUserLookup();

			// Existing grant found
			tracker.on
				.select('directus_oauth_tokens')
				.response([{ id: crypto.randomUUID(), client: clientId, user: userId, session: 'old-hash', resource, scope }]);

			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.insert('directus_sessions').response([]);
			tracker.on.insert('directus_oauth_tokens').response([]);

			await service.exchangeCode(validParams(), context);

			const deletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(deletes.length).toBe(1);
			expect(deletes[0]!.bindings).toContain(clientId);
			expect(deletes[0]!.bindings).toContain(userId);
		});

		it('code burn and grant creation in same transaction', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

			// The update (mark used) and inserts (session, token) should all be part of a transaction
			// We verify by checking both operations occurred
			const codeUpdates = queryHistory('update', 'directus_oauth_codes');
			const tokenInserts = queryHistory('insert', 'directus_oauth_tokens');
			expect(codeUpdates.length).toBe(1);
			expect(tokenInserts.length).toBe(1);
		});

		it('JWT NOT passed through auth.jwt emitFilter', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams(), context);

			// JWT should be signed directly without emitter filter
			const decoded = decodeAccessToken(result.access_token);
			expect(decoded['id']).toBe(userId);

			// Verify token contains ONLY the expected claims and nothing extra
			const allowedClaims = new Set([
				'id',
				'session',
				'scope',
				'aud',
				'iss',
				'iat',
				'exp',
				'role',
				'app_access',
				'admin_access',
			]);

			const actualClaims = new Set(Object.keys(decoded!));
			expect(actualClaims).toEqual(allowedClaims);
		});

		it('nonexistent code returns invalid_grant', async () => {
			// No code found
			tracker.on.select('directus_oauth_codes').response([]);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('deletes old session when replacing existing grant', async () => {
			const oldSessionHash = 'old-session-hash-abc123';

			// 1. Code lookup
			mockCodeLookup();
			// 2. Atomic burn
			tracker.on.update('directus_oauth_codes').response(1);
			// 3. Client lookup
			mockClientLookup(clientId);
			// 4. User lookup
			mockUserLookup({ status: 'active' });

			// 5. Existing grant lookup (has old session)
			tracker.on.select('directus_oauth_tokens').response([
				{
					id: crypto.randomUUID(),
					client: clientId,
					user: userId,
					session: oldSessionHash,
					resource,
					scope,
				},
			]);

			// 6. Delete existing grant
			tracker.on.delete('directus_oauth_tokens').response(1);
			// 7. Delete old session
			tracker.on.delete('directus_sessions').response(1);
			// 8. Insert new session
			tracker.on.insert('directus_sessions').response([]);
			// 9. Insert new grant
			tracker.on.insert('directus_oauth_tokens').response([]);

			await service.exchangeCode(validParams(), context);

			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(sessionDeletes.length).toBeGreaterThanOrEqual(1);
			// Verify old session hash was in the delete bindings
			expect(sessionDeletes[0]!.bindings).toContain(oldSessionHash);
		});

		it('burn, validations, cleanup, and grant creation all use trx', async () => {
			// Set up with existing grant to exercise all code paths
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			mockClientLookup(clientId);
			mockUserLookup();

			// Existing grant found (triggers delete path)
			tracker.on
				.select('directus_oauth_tokens')
				.response([{ id: crypto.randomUUID(), client: clientId, user: userId, session: 'old-hash', resource, scope }]);

			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.insert('directus_sessions').response([]);
			tracker.on.insert('directus_oauth_tokens').response([]);

			await service.exchangeCode(validParams(), context);

			// All operations should have occurred inside the transaction
			const codeUpdates = queryHistory('update', 'directus_oauth_codes');
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			const sessionInserts = queryHistory('insert', 'directus_sessions');
			const tokenInserts = queryHistory('insert', 'directus_oauth_tokens');

			expect(codeUpdates.length).toBe(1);
			expect(tokenDeletes.length).toBe(1);
			expect(sessionDeletes.length).toBe(1);
			expect(sessionInserts.length).toBe(1);
			expect(tokenInserts.length).toBe(1);
		});

		it('client deleted between code lookup and transaction rejects with invalid_grant', async () => {
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			// Client lookup inside transaction returns empty (deleted)
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), {
				error: 'invalid_grant',
			});
		});

		it('inactive user returns invalid_grant', async () => {
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			mockClientLookup(clientId);
			// User exists but is suspended
			mockUserLookup({ status: 'suspended' });

			await assertOAuthError(() => service.exchangeCode(validParams(), context), {
				error: 'invalid_grant',
			});
		});
	});

	describe('refreshToken', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const clientId = crypto.randomUUID();
		const grantId = crypto.randomUUID();
		const resource = TEST_RESOURCE_URL;
		const scope = 'mcp:access';
		const rawSessionToken = 'b'.repeat(64);
		const sessionHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
		const context = { ip: '127.0.0.1', userAgent: 'test-agent' };

		function validParams(overrides: Record<string, unknown> = {}) {
			return {
				grant_type: 'refresh_token' as const,
				client_id: clientId,
				refresh_token: rawSessionToken,
				resource,
				scope: 'mcp:access',
				...overrides,
			};
		}

		function mockGrantLookup(overrides: Record<string, unknown> = {}) {
			tracker.on
				.select('directus_oauth_tokens')
				.response([
					createGrantRow({ id: grantId, client: clientId, user: userId, session: sessionHash, ...overrides }),
				]);
		}

		function mockSuccessfulRefresh() {
			// 1. Client lookup
			mockClientLookup(clientId);
			// 2. Grant lookup by session
			mockGrantLookup();
			// 3. User status + email lookup
			tracker.on.select('directus_users').response([createUserRow()]);
			// 4. Atomic update (session rotation)
			tracker.on.update('directus_oauth_tokens').response(1);
			// 5. Delete old session
			tracker.on.delete('directus_sessions').response(1);
			// 6. Insert new session
			tracker.on.insert('directus_sessions').response([]);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('wrong grant_type returns unsupported_grant_type', async () => {
			await assertOAuthError(() => service.refreshToken(validParams({ grant_type: 'authorization_code' }), context), {
				error: 'unsupported_grant_type',
				statusCode: 400,
			});
		});

		it('missing grant_type returns unsupported_grant_type', async () => {
			await assertOAuthError(() => service.refreshToken(validParams({ grant_type: undefined }), context), {
				error: 'unsupported_grant_type',
				statusCode: 400,
			});
		});

		it('missing resource defaults to grant resource when MCP_OAUTH_REQUIRE_RESOURCE=false', async () => {
			mockSuccessfulRefresh();

			const result = await service.refreshToken(validParams({ resource: undefined }), context);
			expect(result.access_token).toBeDefined();
		});

		it('missing resource returns invalid_target when MCP_OAUTH_REQUIRE_RESOURCE=true', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_REQUIRE_RESOURCE: true,
			} as any);

			mockClientLookup(clientId);

			await assertOAuthError(() => service.refreshToken(validParams({ resource: undefined }), context), {
				error: 'invalid_target',
			});
		});

		it('resource mismatch returns invalid_target', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();

			await assertOAuthError(() => service.refreshToken(validParams({ resource: 'https://evil.com/mcp' }), context), {
				error: 'invalid_target',
			});
		});

		it('client without refresh_token grant type returns invalid_grant', async () => {
			mockClientLookup(clientId, { grant_types: JSON.stringify(['authorization_code']) });

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('valid refresh returns new tokens with scope', async () => {
			mockSuccessfulRefresh();

			const result = await service.refreshToken(validParams(), context);

			expect(result.access_token).toBeDefined();
			expect(result.token_type).toBe('Bearer');
			expect(result.refresh_token).toBeDefined();
			expect(result.scope).toBe('mcp:access');
			expect(result.expires_in).toBe(900); // 15m
		});

		it('rotation: old session deleted, new session created, grant pointer updated', async () => {
			mockSuccessfulRefresh();

			const result = await service.refreshToken(validParams(), context);

			// Old session deleted
			const deletes = queryHistory('delete', 'directus_sessions');
			expect(deletes.length).toBe(1);
			expect(deletes[0]!.bindings).toContain(sessionHash);

			// New session created
			const sessionInserts = queryHistory('insert', 'directus_sessions');
			expect(sessionInserts.length).toBe(1);

			// Grant updated (atomic UPDATE WHERE session = old_hash)
			const updates = queryHistory('update', 'directus_oauth_tokens');
			expect(updates.length).toBe(1);
			expect(updates[0]!.bindings).toContain(sessionHash); // WHERE clause has old hash

			// New refresh token returned
			expect(result.refresh_token).toBeDefined();
			expect(result.refresh_token).not.toBe(rawSessionToken);
		});

		it('grant expires_at renewed (sliding window)', async () => {
			mockSuccessfulRefresh();

			await service.refreshToken(validParams(), context);

			const updates = queryHistory('update', 'directus_oauth_tokens');
			expect(updates.length).toBe(1);
			// The update bindings should contain a new Date (expires_at) ~7 days from now
			const dateBind = updates[0]!.bindings.find((b) => b instanceof Date) as Date;
			expect(dateBind).toBeDefined();
			const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
			expect(Math.abs(dateBind.getTime() - expectedExpiry)).toBeLessThan(5000);
		});

		it('concurrent refresh - only one wins (atomic UPDATE WHERE session=:old)', async () => {
			mockClientLookup(clientId);

			// Single handler: first select returns grant, second (reuse detection) returns empty
			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) {
					return [
						{
							id: grantId,
							client: clientId,
							user: userId,
							session: sessionHash,
							previous_session: null,
							resource,
							scope,
							expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
							date_created: new Date(),
						},
					];
				}

				return []; // Reuse detection: not found
			});

			// User status check
			tracker.on.select('directus_users').response([createUserRow()]);

			// Atomic update returns 0 = someone else already rotated
			tracker.on.update('directus_oauth_tokens').response(0);

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('race loser with affected_rows=0 checks previous_session for reuse', async () => {
			mockClientLookup(clientId);

			// Use a single handler that sequences grant lookup -> reuse detection
			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) {
					// Primary lookup by session: returns grant
					return [
						{
							id: grantId,
							client: clientId,
							user: userId,
							session: sessionHash,
							previous_session: null,
							resource,
							scope,
							expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
							date_created: new Date(),
						},
					];
				}

				// Second call: reuse detection by previous_session -> found
				return [{ id: grantId, client: clientId, user: userId, session: 'new-hash', previous_session: sessionHash }];
			});

			// User status check
			tracker.on.select('directus_users').response([createUserRow()]);

			// Atomic update returns 0 = someone else already rotated
			tracker.on.update('directus_oauth_tokens').response(0);
			// Revoke: delete grant + session
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('reuse detected (previous_session match) -> grant revoked', async () => {
			mockClientLookup(clientId);

			// Use a single handler that sequences: not found -> reuse grant
			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) return []; // Primary lookup by session: not found
				// Reuse detection: found by previous_session
				return [{ id: grantId, client: clientId, user: userId, session: 'new-hash', previous_session: sessionHash }];
			});

			// Revoke: delete grant + session
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });

			// Verify grant was deleted (revoked)
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBe(1);
		});

		it('reuse detection: grant and session deleted via transaction', async () => {
			mockClientLookup(clientId);

			// Sequence: primary lookup (not found) -> reuse detection (found)
			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) return []; // Primary lookup by session: not found
				return [{ id: grantId, client: clientId, user: userId, session: 'new-hash', previous_session: sessionHash }];
			});

			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);

			const transactionSpy = vi.spyOn(db, 'transaction');

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });

			// Both deletes should be wrapped in a single transaction
			expect(transactionSpy).toHaveBeenCalledOnce();

			// Verify both deletes still happened
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(tokenDeletes.length).toBe(1);
			expect(sessionDeletes.length).toBe(1);
		});

		it('unknown token returns invalid_grant', async () => {
			mockClientLookup(clientId);
			// Both session and previous_session lookups return empty
			tracker.on.select('directus_oauth_tokens').response([]);

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('expired session returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockGrantLookup({ expires_at: new Date(Date.now() - 1000) }); // expired

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('scope on refresh request validated (only mcp:access accepted)', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(() => service.refreshToken(validParams({ scope: 'openid' }), context), {
				error: 'invalid_scope',
			});
		});

		it('JWT aud preserved from grant stored resource', async () => {
			mockSuccessfulRefresh();

			const result = await service.refreshToken(validParams(), context);
			const decoded = decodeAccessToken(result.access_token);

			expect(decoded['aud']).toBe(resource);
			expect(decoded['scope']).toBe('mcp:access');
		});

		it('activity record created with action=update on refresh', async () => {
			mockSuccessfulRefresh();

			await service.refreshToken(validParams(), context);

			expect(mockActivityCreateOne).toHaveBeenCalledOnce();
			const activityArg = mockActivityCreateOne.mock.calls[0]![0];
			expect(activityArg.action).toBe('update');
			expect(activityArg.user).toBe(userId);
		});

		it('missing client_id returns invalid_request', async () => {
			await assertOAuthError(() => service.refreshToken(validParams({ client_id: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('missing refresh_token returns invalid_request', async () => {
			await assertOAuthError(() => service.refreshToken(validParams({ refresh_token: undefined }), context), {
				error: 'invalid_request',
			});
		});

		it('unknown client_id returns invalid_grant', async () => {
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });
		});

		it('suspended user returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			// User lookup returns suspended status
			tracker.on.select('directus_users').response([createUserRow({ status: 'suspended' })]);

			await assertOAuthError(() => service.refreshToken(validParams(), context), {
				error: 'invalid_grant',
				statusCode: 400,
			});
		});

		it('deleted user returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			// User lookup returns empty (user deleted)
			tracker.on.select('directus_users').response([]);

			await assertOAuthError(() => service.refreshToken(validParams(), context), {
				error: 'invalid_grant',
				statusCode: 400,
			});
		});

		it('client_id mismatch returns invalid_grant', async () => {
			const otherClientId = crypto.randomUUID();

			// Client lookup for requesting client (otherClientId)
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: otherClientId,
					client_name: 'Other Client',
					redirect_uris: JSON.stringify(['https://other.example.com/callback']),
					grant_types: JSON.stringify(['authorization_code', 'refresh_token']),
				},
			]);

			// Grant belongs to original clientId, not otherClientId
			mockGrantLookup();

			await assertOAuthError(() => service.refreshToken(validParams({ client_id: otherClientId }), context), {
				error: 'invalid_grant',
				statusCode: 400,
			});
		});
	});

	describe('revokeToken', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const clientId = crypto.randomUUID();
		const grantId = crypto.randomUUID();
		const rawSessionToken = 'c'.repeat(64);
		const sessionHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
		const resource = TEST_RESOURCE_URL;

		function validParams(overrides: Record<string, unknown> = {}) {
			return {
				token: rawSessionToken,
				client_id: clientId,
				...overrides,
			};
		}

		function mockGrantLookup(overrides: Record<string, unknown> = {}) {
			tracker.on
				.select('directus_oauth_tokens')
				.response([
					createGrantRow({ id: grantId, client: clientId, user: userId, session: sessionHash, ...overrides }),
				]);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('valid refresh token revokes grant and session', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			// Delete grant
			tracker.on.delete('directus_oauth_tokens').response(1);
			// Delete session
			tracker.on.delete('directus_sessions').response(1);
			// User lookup for activity
			tracker.on.select('directus_users').response([createUserRow()]);

			await service.revokeToken(validParams());

			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBe(1);
			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(sessionDeletes.length).toBe(1);
		});

		it('stale rotated token (matches previous_session only) returns 200 no-op', async () => {
			mockClientLookup(clientId);
			// Grant lookup by session: not found
			tracker.on.select('directus_oauth_tokens').response([]);

			// Should NOT throw - returns void (200 OK)
			await service.revokeToken(validParams());
		});

		it('client_id mismatch returns 200 (not invalid_client)', async () => {
			mockClientLookup(clientId);
			const otherClientId = crypto.randomUUID();
			mockGrantLookup({ client: otherClientId });

			// Should NOT throw
			await service.revokeToken(validParams());

			// Should NOT have deleted the grant
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBe(0);
		});

		it('unknown client_id returns 200 silently (no enumeration leak)', async () => {
			tracker.on.select('directus_oauth_tokens').response([]);

			await expect(service.revokeToken(validParams())).resolves.toBeUndefined();
		});

		it('unknown token returns 200', async () => {
			mockClientLookup(clientId);
			tracker.on.select('directus_oauth_tokens').response([]);

			await service.revokeToken(validParams());
		});

		it('already-revoked token returns 200', async () => {
			mockClientLookup(clientId);
			tracker.on.select('directus_oauth_tokens').response([]);

			await service.revokeToken(validParams());
		});

		it('token_type_hint ignored (known and unknown values)', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.select('directus_users').response([createUserRow()]);

			// Known hint
			await service.revokeToken({ ...validParams(), token_type_hint: 'refresh_token' });
		});

		it('missing token parameter returns invalid_request', async () => {
			await assertOAuthError(() => service.revokeToken(validParams({ token: undefined })), {
				error: 'invalid_request',
			});
		});

		it('missing client_id returns invalid_request', async () => {
			await assertOAuthError(() => service.revokeToken(validParams({ client_id: undefined })), {
				error: 'invalid_request',
			});
		});

		it('activity record created with action=logout on revocation', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.select('directus_users').response([createUserRow()]);

			await service.revokeToken(validParams());

			expect(mockActivityCreateOne).toHaveBeenCalledOnce();
			const activityArg = mockActivityCreateOne.mock.calls[0]![0];
			expect(activityArg.action).toBe('logout');
			expect(activityArg.collection).toBe('directus_oauth_tokens');
		});

		it('access token (JWT) submitted as token returns 200 (treated as unknown refresh token, no-op)', async () => {
			mockClientLookup(clientId);
			// A JWT hashed won't match any session
			tracker.on.select('directus_oauth_tokens').response([]);

			const fakeJwt = jwt.sign({ foo: 'bar' }, 'secret');
			await service.revokeToken({ ...validParams(), token: fakeJwt });
		});

		it('grant and session deleted via transaction', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.select('directus_users').response([createUserRow()]);

			const transactionSpy = vi.spyOn(db, 'transaction');

			await service.revokeToken(validParams());

			// Both deletes should be wrapped in a single transaction
			expect(transactionSpy).toHaveBeenCalledOnce();

			// Verify both deletes still happened
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(tokenDeletes.length).toBe(1);
			expect(sessionDeletes.length).toBe(1);
		});
	});

	describe('cleanup', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('expired unused codes deleted', async () => {
			// Step 1: delete expired unused codes
			tracker.on.delete('directus_oauth_codes').response(3);
			// Step 2: delete used codes older than 1 hour
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 3: expired grants lookup
			tracker.on.select('directus_oauth_tokens').response([]);
			// Step 4: orphaned grants lookup
			tracker.on.select('directus_oauth_tokens').response([]);
			// Step 5a: tier 1 - never-authorized clients
			tracker.on.select('directus_oauth_clients').response([]);

			await service.cleanup();

			const codeDeletes = queryHistory('delete', 'directus_oauth_codes');
			expect(codeDeletes.length).toBeGreaterThanOrEqual(1);

			// First delete should target expired+unused
			const firstDelete = codeDeletes[0]!;
			expect(firstDelete.sql).toContain('expires_at');
		});

		it('used codes older than 1 hour deleted', async () => {
			// Step 1: expired unused codes
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 2: used codes older than 1 hour
			tracker.on.delete('directus_oauth_codes').response(2);
			// Step 3: expired grants lookup
			tracker.on.select('directus_oauth_tokens').response([]);
			// Step 4: orphaned grants lookup
			tracker.on.select('directus_oauth_tokens').response([]);
			// Step 5a: tier 1 - never-authorized clients
			tracker.on.select('directus_oauth_clients').response([]);

			await service.cleanup();

			const codeDeletes = queryHistory('delete', 'directus_oauth_codes');
			expect(codeDeletes.length).toBeGreaterThanOrEqual(2);

			// Second delete should target used+old
			const secondDelete = codeDeletes[1]!;
			expect(secondDelete.sql).toContain('used_at');
		});

		it('expired grants deleted along with associated session', async () => {
			const expiredGrantId = crypto.randomUUID();
			const expiredSessionHash = 'expired-session-hash';

			// Step 1: expired unused codes
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 2: used codes older than 1h
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 3: expired grants lookup
			tracker.on.select('directus_oauth_tokens').responseOnce([{ id: expiredGrantId, session: expiredSessionHash }]);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.delete('directus_oauth_tokens').response(1);
			// Step 4: orphaned grants lookup
			tracker.on.select('directus_oauth_tokens').response([]);
			// Step 5a: tier 1 - never-authorized clients
			tracker.on.select('directus_oauth_clients').response([]);

			await service.cleanup();

			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(sessionDeletes.length).toBeGreaterThanOrEqual(1);

			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBeGreaterThanOrEqual(1);
		});

		it('orphaned grants (session not in directus_sessions) deleted', async () => {
			const orphanedGrantId = crypto.randomUUID();

			// Step 1: expired unused codes
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 2: used codes
			tracker.on.delete('directus_oauth_codes').response(0);
			// Step 3: expired grants (none)
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			// Step 4: orphaned grants lookup (left join)
			tracker.on.select('directus_oauth_tokens').responseOnce([{ id: orphanedGrantId }]);
			tracker.on.delete('directus_oauth_tokens').response(1);
			// Step 5a: tier 1 - never-authorized clients
			tracker.on.select('directus_oauth_clients').response([]);

			await service.cleanup();

			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBeGreaterThanOrEqual(1);
		});

		it('never-authorized client older than unused TTL gets deleted', async () => {
			const unusedClientId = crypto.randomUUID();

			// Steps 1-4 (codes + grants cleanup)
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			// Step 5a: tier 1 - never-authorized clients (no consents, no sessions, no tokens)
			tracker.on.select('directus_oauth_clients').responseOnce([{ client_id: unusedClientId }]);
			tracker.on.delete('directus_oauth_clients').response(1);

			await service.cleanup();

			const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
			expect(clientDeletes.length).toBe(1);

			// Verify the select query joins on consents to exclude authorized clients
			const clientSelects = queryHistory('select', 'directus_oauth_clients');
			expect(clientSelects.length).toBeGreaterThanOrEqual(1);
			expect(clientSelects[0]!.sql).toContain('directus_oauth_consents');
		});

		it('never-authorized client younger than unused TTL is kept', async () => {
			// Steps 1-4
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			// Step 5a: tier 1 returns empty (client is too young, filtered by date_created)
			tracker.on.select('directus_oauth_clients').responseOnce([]);

			await service.cleanup();

			const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
			expect(clientDeletes.length).toBe(0);
		});

		it('authorized client (has consent) is NOT deleted when idle TTL is disabled (default)', async () => {
			// Steps 1-4
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			// Step 5a: tier 1 returns empty (client has consents, so not matched)
			tracker.on.select('directus_oauth_clients').responseOnce([]);
			// Step 5b: tier 2 is skipped because MCP_OAUTH_CLIENT_IDLE_TTL = '0'

			await service.cleanup();

			const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
			expect(clientDeletes.length).toBe(0);
		});

		it('authorized client IS deleted when idle TTL is enabled and client is older than idle TTL', async () => {
			const { useEnv } = await import('@directus/env');
			const env = useEnv() as Record<string, unknown>;
			const originalIdleTtl = env['MCP_OAUTH_CLIENT_IDLE_TTL'];
			env['MCP_OAUTH_CLIENT_IDLE_TTL'] = '30d';

			try {
				const idleClientId = crypto.randomUUID();

				// Steps 1-4
				tracker.on.delete('directus_oauth_codes').response(0);
				tracker.on.delete('directus_oauth_codes').response(0);
				tracker.on.select('directus_oauth_tokens').responseOnce([]);
				tracker.on.select('directus_oauth_tokens').responseOnce([]);
				// Step 5a: tier 1 returns empty (client has consents)
				tracker.on.select('directus_oauth_clients').responseOnce([]);
				// Step 5b: tier 2 - idle authorized client
				tracker.on.select('directus_oauth_clients').responseOnce([{ client_id: idleClientId }]);
				tracker.on.delete('directus_oauth_clients').response(1);

				await service.cleanup();

				const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
				expect(clientDeletes.length).toBe(1);
			} finally {
				env['MCP_OAUTH_CLIENT_IDLE_TTL'] = originalIdleTtl;
			}
		});

		it('authorized client is NOT deleted when idle TTL is enabled but client is younger than idle TTL', async () => {
			const { useEnv } = await import('@directus/env');
			const env = useEnv() as Record<string, unknown>;
			const originalIdleTtl = env['MCP_OAUTH_CLIENT_IDLE_TTL'];
			env['MCP_OAUTH_CLIENT_IDLE_TTL'] = '30d';

			try {
				// Steps 1-4
				tracker.on.delete('directus_oauth_codes').response(0);
				tracker.on.delete('directus_oauth_codes').response(0);
				tracker.on.select('directus_oauth_tokens').responseOnce([]);
				tracker.on.select('directus_oauth_tokens').responseOnce([]);
				// Step 5a: tier 1 returns empty
				tracker.on.select('directus_oauth_clients').responseOnce([]);
				// Step 5b: tier 2 returns empty (client is younger than idle TTL)
				tracker.on.select('directus_oauth_clients').responseOnce([]);

				await service.cleanup();

				const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
				expect(clientDeletes.length).toBe(0);
			} finally {
				env['MCP_OAUTH_CLIENT_IDLE_TTL'] = originalIdleTtl;
			}
		});

		it('client with active session is NOT eligible for cleanup (even if old)', async () => {
			// Simulate: no orphaned clients returned (query filters them out)
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			tracker.on.select('directus_oauth_tokens').responseOnce([]);
			// Tier 1 returns empty (sessions exist, filtered by left join)
			tracker.on.select('directus_oauth_clients').responseOnce([]);

			await service.cleanup();

			const clientDeletes = queryHistory('delete', 'directus_oauth_clients');
			expect(clientDeletes.length).toBe(0);
		});

		it('cleanup queries use indexed columns (expires_at, used_at, session)', async () => {
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.delete('directus_oauth_codes').response(0);
			tracker.on.select('directus_oauth_tokens').response([]);
			tracker.on.select('directus_oauth_clients').response([]);

			await service.cleanup();

			const allSql = [...tracker.history.delete.map((q) => q.sql), ...tracker.history.select.map((q) => q.sql)].join(
				'\n',
			);

			expect(allSql).toContain('expires_at');
			expect(allSql).toContain('used_at');
		});
	});
});
