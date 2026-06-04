import crypto from 'node:crypto';
import { RecordNotUniqueError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import jwt from 'jsonwebtoken';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { McpOAuthService, OAuthError } from './index.js';

vi.mock('../../database/index.js', () => ({
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
		MCP_OAUTH_DCR_ENABLED: true,
		MCP_OAUTH_CIMD_ENABLED: true,
	}),
}));

const TEST_SECRET = 'test-secret-key-for-mcp-oauth';

vi.mock('../../utils/get-secret.js', () => ({
	getSecret: () => TEST_SECRET,
}));

const mockNanoid = vi.fn().mockReturnValue('a'.repeat(64));

vi.mock('nanoid', () => ({
	nanoid: (...args: unknown[]) => mockNanoid(...args),
}));

const mockFetchRolesTree = vi.fn().mockResolvedValue(['role-1']);

vi.mock('../../permissions/lib/fetch-roles-tree.js', () => ({
	fetchRolesTree: (...args: unknown[]) => mockFetchRolesTree(...args),
}));

const mockFetchGlobalAccess = vi.fn().mockResolvedValue({ app: true, admin: false });

vi.mock('../../permissions/modules/fetch-global-access/fetch-global-access.js', () => ({
	fetchGlobalAccess: (...args: unknown[]) => mockFetchGlobalAccess(...args),
}));

const mockActivityCreateOne = vi.fn().mockResolvedValue('activity-id');

vi.mock('../activity.js', () => ({
	ActivityService: vi.fn().mockImplementation(() => ({
		createOne: mockActivityCreateOne,
	})),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}),
}));

const mockDetectClientIdType = vi.fn().mockReturnValue('dcr');
const mockFetchCimdMetadata = vi.fn();
const mockGetAllowedDomains = vi.fn().mockReturnValue([]);
const mockIsDomainAllowed = vi.fn().mockReturnValue(true);
const mockValidateCimdHostnameEgress = vi.fn().mockResolvedValue(undefined);

vi.mock('./cimd.js', () => ({
	detectClientIdType: (...args: unknown[]) => mockDetectClientIdType(...args),
	fetchCimdMetadata: (...args: unknown[]) => mockFetchCimdMetadata(...args),
	getAllowedDomains: (...args: unknown[]) => mockGetAllowedDomains(...args),
	isDomainAllowed: (...args: unknown[]) => mockIsDomainAllowed(...args),
}));

vi.mock('./utils/cimd-egress.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./utils/cimd-egress.js')>();

	return {
		...actual,
		validateCimdHostnameEgress: (...args: unknown[]) => mockValidateCimdHostnameEgress(...args),
	};
});

const mockTranslateDatabaseError = vi.fn().mockResolvedValue(new Error('unknown'));

vi.mock('../../database/errors/translate.js', () => ({
	translateDatabaseError: (...args: unknown[]) => mockTranslateDatabaseError(...args),
}));

const consentKey = crypto.createHmac('sha256', TEST_SECRET).update('mcp-oauth-consent-v1').digest();

const schema = new SchemaBuilder()
	.collection('directus_oauth_clients', (c) => {
		c.field('client_id').uuid().primary();
	})
	.build();

// --- Parameterized confidential client methods ---

const confidentialMethods = [
	{
		method: 'client_secret_basic' as const,
		label: 'client_secret_basic',
		makeAuthParams: (clientId: string, secret: string) => ({
			authorization_header: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
		}),
	},
	{
		method: 'client_secret_post' as const,
		label: 'client_secret_post',
		makeAuthParams: (_clientId: string, secret: string) => ({
			client_secret: secret,
		}),
	},
];

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
			MCP_OAUTH_DCR_ENABLED: true,
			MCP_OAUTH_CIMD_ENABLED: true,
		} as any);

		mockNanoid.mockReturnValue('a'.repeat(64));
		mockFetchRolesTree.mockResolvedValue(['role-1']);
		mockFetchGlobalAccess.mockResolvedValue({ app: true, admin: false });
		mockActivityCreateOne.mockResolvedValue('activity-id');
		mockDetectClientIdType.mockReturnValue('dcr');
		mockFetchCimdMetadata.mockReset();
		mockGetAllowedDomains.mockReturnValue([]);
		mockIsDomainAllowed.mockReturnValue(true);
		mockValidateCimdHostnameEgress.mockResolvedValue(undefined);
		mockTranslateDatabaseError.mockResolvedValue(new Error('unknown'));
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

		it('includes bearer_methods_supported: ["header"]', () => {
			const meta = service.getProtectedResourceMetadata();
			expect(meta.bearer_methods_supported).toEqual(['header']);
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

		function mockSettings(overrides: Record<string, unknown> = {}) {
			tracker.on
				.select('directus_settings')
				.response([{ mcp_oauth_dcr_enabled: true, mcp_oauth_cimd_enabled: false, ...overrides }]);
		}

		it('issuer matches PUBLIC_URL', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.issuer).toBe(TEST_PUBLIC_URL);
		});

		it('issuer includes subpath', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: 'https://example.com/directus',
				MCP_OAUTH_DCR_ENABLED: true,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			const svc = new McpOAuthService({ knex: db, schema });
			mockSettings();
			const meta = await svc.getAuthorizationServerMetadata();
			expect(meta.issuer).toBe('https://example.com/directus');
		});

		it('all endpoint URLs include subpath', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: 'https://example.com/directus',
				MCP_OAUTH_DCR_ENABLED: true,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			const svc = new McpOAuthService({ knex: db, schema });
			mockSettings();
			const meta = await svc.getAuthorizationServerMetadata();

			expect(meta.authorization_endpoint).toContain('/directus/');
			expect(meta.token_endpoint).toContain('/directus/');
			expect(meta.registration_endpoint).toContain('/directus/');
			expect(meta.revocation_endpoint).toContain('/directus/');
		});

		it('includes response_modes_supported: ["query"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.response_modes_supported).toEqual(['query']);
		});

		it('includes authorization_response_iss_parameter_supported: true', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.authorization_response_iss_parameter_supported).toBe(true);
		});

		it('includes response_types_supported: ["code"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.response_types_supported).toEqual(['code']);
		});

		it('includes grant_types_supported: ["authorization_code", "refresh_token"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
		});

		it('includes token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.token_endpoint_auth_methods_supported).toEqual(['none', 'client_secret_basic', 'client_secret_post']);
		});

		it('includes revocation_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();

			expect(meta.revocation_endpoint_auth_methods_supported).toEqual([
				'none',
				'client_secret_basic',
				'client_secret_post',
			]);
		});

		it('includes code_challenge_methods_supported: ["S256"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.code_challenge_methods_supported).toEqual(['S256']);
		});

		it('includes scopes_supported: ["mcp:access"]', async () => {
			mockSettings();
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.scopes_supported).toEqual(['mcp:access']);
		});

		it('includes registration_endpoint when DCR enabled', async () => {
			mockSettings({ mcp_oauth_dcr_enabled: true });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.registration_endpoint).toBe(`${TEST_PUBLIC_URL}/mcp-oauth/register`);
		});

		it('omits registration_endpoint when DCR disabled in settings', async () => {
			mockSettings({ mcp_oauth_dcr_enabled: false });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta).not.toHaveProperty('registration_endpoint');
		});

		it('omits registration_endpoint when DCR disabled in env', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_DCR_ENABLED: false,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			mockSettings({ mcp_oauth_dcr_enabled: true });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta).not.toHaveProperty('registration_endpoint');
		});

		it('includes client_id_metadata_document_supported when CIMD enabled', async () => {
			mockSettings({ mcp_oauth_cimd_enabled: true });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta.client_id_metadata_document_supported).toBe(true);
		});

		it('omits client_id_metadata_document_supported when CIMD disabled', async () => {
			mockSettings({ mcp_oauth_cimd_enabled: false });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta).not.toHaveProperty('client_id_metadata_document_supported');
		});

		it('subpath: PUBLIC_URL=https://example.com/directus produces correct URLs', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: 'https://example.com/directus',
				MCP_OAUTH_DCR_ENABLED: true,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			const svc = new McpOAuthService({ knex: db, schema });
			mockSettings();
			const meta = await svc.getAuthorizationServerMetadata();

			expect(meta.issuer).toBe('https://example.com/directus');
			expect(meta.authorization_endpoint).toBe('https://example.com/directus/mcp-oauth/authorize');
			expect(meta.token_endpoint).toBe('https://example.com/directus/mcp-oauth/token');
			expect(meta.registration_endpoint).toBe('https://example.com/directus/mcp-oauth/register');
			expect(meta.revocation_endpoint).toBe('https://example.com/directus/mcp-oauth/revoke');
		});

		it('env CIMD=false overrides settings CIMD=true (AND logic)', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_DCR_ENABLED: true,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			mockSettings({ mcp_oauth_cimd_enabled: true });
			const meta = await service.getAuthorizationServerMetadata();
			expect(meta).not.toHaveProperty('client_id_metadata_document_supported');
		});
	});

	describe('registerClient', () => {
		let service: McpOAuthService;

		function mockDcrSettings(overrides: Record<string, unknown> = {}) {
			tracker.on.select('directus_settings').response([{ mcp_oauth_dcr_enabled: true, ...overrides }]);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
			// DCR gate queries settings before any validation
			mockDcrSettings();
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

		it.each([undefined, null, 'not an object', 123, []])('rejects non-object registration body: %s', async (body) => {
			await assertOAuthError(() => service.registerClient(body), {
				error: 'invalid_client_metadata',
				statusCode: 400,
			});
		});

		it('omitted token_endpoint_auth_method defaults to client_secret_basic per RFC 7591', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ token_endpoint_auth_method: undefined }));

			expect(result.token_endpoint_auth_method).toBe('client_secret_basic');
			expect(result.client_secret).toBeDefined();
			expect(result.client_secret!.length).toBeGreaterThanOrEqual(32);
			expect(result.client_secret_expires_at).toBe(0);
		});

		it('explicit token_endpoint_auth_method=none accepted', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ token_endpoint_auth_method: 'none' }));

			expect(result.token_endpoint_auth_method).toBe('none');
		});

		it('client_secret_basic accepted and returns client_secret', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(
				createTestClient({ token_endpoint_auth_method: 'client_secret_basic' }),
			);

			expect(result.client_secret).toBeDefined();
			expect(result.client_secret!.length).toBeGreaterThanOrEqual(32);
			expect(result.client_secret_expires_at).toBe(0);
			expect(result.token_endpoint_auth_method).toBe('client_secret_basic');
		});

		it('client_secret_post accepted and returns client_secret', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(
				createTestClient({ token_endpoint_auth_method: 'client_secret_post' }),
			);

			expect(result.client_secret).toBeDefined();
			expect(result.client_secret!.length).toBeGreaterThanOrEqual(32);
			expect(result.client_secret_expires_at).toBe(0);
			expect(result.token_endpoint_auth_method).toBe('client_secret_post');
		});

		it('auth_method=none does NOT return client_secret', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ token_endpoint_auth_method: 'none' }));

			expect(result.client_secret).toBeUndefined();
			expect(result.client_secret_expires_at).toBeUndefined();
		});

		it('public client registration stores null client_secret_hash', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			await service.registerClient(createTestClient({ token_endpoint_auth_method: 'none' }));

			const insertCall = tracker.history.insert[0];

			const columns =
				insertCall!.sql
					.match(/\((.*)\) values/i)?.[1]
					?.split(',')
					.map((column) => column.replaceAll('"', '').trim()) ?? [];

			const clientSecretHashIndex = columns.indexOf('client_secret_hash');

			expect(clientSecretHashIndex).toBeGreaterThanOrEqual(0);
			expect(insertCall!.bindings[clientSecretHashIndex]).toBeNull();
		});

		it('unsupported auth method (e.g. private_key_jwt) rejected', async () => {
			await assertOAuthError(
				() => service.registerClient(createTestClient({ token_endpoint_auth_method: 'private_key_jwt' })),
				{ error: 'invalid_client_metadata' },
			);
		});

		it('stores SHA-256 hash of secret, not the raw secret', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(
				createTestClient({ token_endpoint_auth_method: 'client_secret_basic' }),
			);

			const insertHistory = queryHistory('insert', 'directus_oauth_clients');
			expect(insertHistory.length).toBe(1);

			const bindings = insertHistory[0]!.bindings;
			// Raw secret must NOT appear in stored bindings
			expect(bindings).not.toContain(result.client_secret);
			// SHA-256 hash of the secret MUST appear
			const expectedHash = crypto.createHash('sha256').update(result.client_secret!).digest('hex');
			expect(bindings).toContain(expectedHash);
		});

		it('grant_types must contain authorization_code', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: ['refresh_token'] })), {
				error: 'invalid_client_metadata',
			});
		});

		it('omitted grant_types defaults to authorization_code per RFC 7591', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(createTestClient({ grant_types: undefined }));

			expect(result.grant_types).toEqual(['authorization_code']);
		});

		it('non-array grant_types rejected with invalid_client_metadata', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: 'authorization_code' })), {
				error: 'invalid_client_metadata',
			});
		});

		it('null grant_types rejected with invalid_client_metadata', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ grant_types: null })), {
				error: 'invalid_client_metadata',
			});
		});

		it('non-string grant_types rejected with invalid_client_metadata', async () => {
			await assertOAuthError(
				() => service.registerClient(createTestClient({ grant_types: ['authorization_code', 123] })),
				{
					error: 'invalid_client_metadata',
				},
			);
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

			it('http://[::1]:3000/callback accepted (IPv6 loopback)', async () => {
				tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
				tracker.on.insert('directus_oauth_clients').response([]);

				const result = await service.registerClient(
					createTestClient({ redirect_uris: ['http://[::1]:3000/callback'] }),
				);

				expect(result.redirect_uris).toEqual(['http://[::1]:3000/callback']);
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

			describe('MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS', () => {
				beforeEach(async () => {
					const { useEnv } = vi.mocked(await import('@directus/env'));

					useEnv.mockReturnValue({
						PUBLIC_URL: 'https://example.com',
						MCP_OAUTH_MAX_CLIENTS: 10000,
						MCP_OAUTH_CLIENT_UNUSED_TTL: '3d',
						MCP_OAUTH_CLIENT_IDLE_TTL: '0',
						MCP_OAUTH_DCR_ENABLED: true,
						MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS: ['cursor.com', '*.anthropic.com'],
					} as any);
				});

				it('accepts exact domain match', async () => {
					tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
					tracker.on.insert('directus_oauth_clients').response([]);

					const result = await service.registerClient(
						createTestClient({ redirect_uris: ['https://cursor.com/callback'] }),
					);

					expect(result.redirect_uris).toEqual(['https://cursor.com/callback']);
				});

				it('accepts wildcard domain match', async () => {
					tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
					tracker.on.insert('directus_oauth_clients').response([]);

					const result = await service.registerClient(
						createTestClient({ redirect_uris: ['https://tools.anthropic.com/callback'] }),
					);

					expect(result.redirect_uris).toEqual(['https://tools.anthropic.com/callback']);
				});

				it('rejects disallowed domain', async () => {
					await assertOAuthError(
						() => service.registerClient(createTestClient({ redirect_uris: ['https://evil.com/callback'] })),
						{ error: 'invalid_redirect_uri' },
					);
				});

				it('accepts localhost redirect even when allowlist is set (native OAuth clients)', async () => {
					tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
					tracker.on.insert('directus_oauth_clients').response([]);

					const result = await service.registerClient(
						createTestClient({ redirect_uris: ['http://localhost:3000/callback'] }),
					);

					expect(result.redirect_uris).toEqual(['http://localhost:3000/callback']);
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

			expect(result).toEqual({
				client_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
				client_name: 'Test MCP Client',
				redirect_uris: [TEST_REDIRECT_URI],
				grant_types: ['authorization_code'],
				response_types: ['code'],
				token_endpoint_auth_method: 'none',
				client_id_issued_at: expect.any(Number),
			});
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
				MCP_OAUTH_DCR_ENABLED: true,
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
				MCP_OAUTH_DCR_ENABLED: true,
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

		it('missing client_name rejected by Directus policy for consent UX', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ client_name: undefined })), {
				error: 'invalid_client_metadata',
			});
		});

		it('sets registration_type to dcr', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			await service.registerClient(createTestClient());

			const insertHistory = queryHistory('insert', 'directus_oauth_clients');
			expect(insertHistory.length).toBe(1);
			expect(insertHistory[0]!.bindings).toContain('dcr');
		});

		it('accepts optional client_uri, logo_uri, tos_uri, policy_uri', async () => {
			tracker.on.select('directus_oauth_clients').response([{ count: 0 }]);
			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.registerClient(
				createTestClient({
					client_uri: 'https://example.com',
					logo_uri: 'https://example.com/logo.png',
					tos_uri: 'https://example.com/tos',
					policy_uri: 'https://example.com/policy',
				}),
			);

			expect(result).toMatchObject({
				client_uri: 'https://example.com',
				logo_uri: 'https://example.com/logo.png',
				tos_uri: 'https://example.com/tos',
				policy_uri: 'https://example.com/policy',
			});
		});

		it('rejects non-HTTPS client_uri', async () => {
			await assertOAuthError(() => service.registerClient(createTestClient({ client_uri: 'http://example.com' })), {
				error: 'invalid_client_metadata',
			});
		});

		it('DCR disabled in env returns 404', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_DCR_ENABLED: false,
			} as any);

			await assertOAuthError(() => service.registerClient(createTestClient()), {
				error: 'not_found',
				statusCode: 404,
			});
		});

		it('DCR disabled in settings returns 404', async () => {
			// Override the beforeEach settings mock
			tracker.reset();
			tracker.on.select('directus_settings').response([{ mcp_oauth_dcr_enabled: false }]);

			await assertOAuthError(() => service.registerClient(createTestClient()), {
				error: 'not_found',
				statusCode: 404,
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

		it('accepts redirect_uris already deserialized by the database driver', async () => {
			mockClientLookup(clientId, { redirect_uris: [TEST_REDIRECT_URI] });

			const result = await service.validateAuthorization(validParams(), userId, sessionHash);

			expect(result.signed_params).toBeDefined();
			expect(result.redirect_uri).toBe(TEST_REDIRECT_URI);
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

		it.each([
			{ host: 'localhost', registered: 'http://localhost/callback', requested: 'http://localhost:54771/callback' },
			{ host: '127.0.0.1', registered: 'http://127.0.0.1/callback', requested: 'http://127.0.0.1:8080/callback' },
			{ host: '[::1]', registered: 'http://[::1]/callback', requested: 'http://[::1]:9999/callback' },
		])(
			'RFC 8252 Section 7.3: $host redirect_uri with different port matches registered portless URI',
			async ({ registered, requested }) => {
				mockClientLookup(clientId, { redirect_uris: JSON.stringify([registered]) });

				const result = await service.validateAuthorization(
					validParams({ redirect_uri: requested }),
					userId,
					sessionHash,
				);

				expect(result.signed_params).toBeDefined();
			},
		);

		it.each(['http://user@localhost:54771/callback', 'http://localhost:54771/callback#fragment'])(
			'rejects decorated requested loopback redirect_uri before trusting redirect: %s',
			async (redirectUri) => {
				mockClientLookup(clientId, { redirect_uris: JSON.stringify(['http://localhost/callback']) });

				await assertOAuthError(
					() => service.validateAuthorization(validParams({ redirect_uri: redirectUri }), userId, sessionHash),
					{
						error: 'invalid_redirect_uri',
						redirectable: false,
					},
				);
			},
		);

		it('loopback port flexibility does NOT apply to non-loopback hosts', async () => {
			mockClientLookup(clientId, { redirect_uris: JSON.stringify(['https://example.com/callback']) });

			await assertOAuthError(
				() =>
					service.validateAuthorization(
						validParams({ redirect_uri: 'https://example.com:8443/callback' }),
						userId,
						sessionHash,
					),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it.each([
			[{ code_challenge: undefined }, 'missing code_challenge', { redirectable: true }],
			[{ code_challenge_method: 'plain' }, 'code_challenge_method != S256', { redirectable: true }],
			[{ code_challenge: 'abc' }, 'code_challenge too short', { statusCode: 400 }],
			[{ code_challenge: 'A'.repeat(44) }, 'code_challenge too long', { statusCode: 400 }],
			[
				{ code_challenge: 'dBjftJeZ4CVP+mB92K27uhbUJU1p1r/wW1gFWFOEjXk' },
				'code_challenge with invalid characters',
				{ statusCode: 400 },
			],
		])('code_challenge validation: %s', async (override, _label, errorOptions) => {
			mockClientLookup(clientId);

			await assertOAuthError(() => service.validateAuthorization(validParams(override), userId, sessionHash), {
				error: 'invalid_request',
				...errorOptions,
			});
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

		it('object client_id returns non-redirectable invalid_request before client lookup', async () => {
			await assertOAuthError(
				() => service.validateAuthorization(validParams({ client_id: { nested: clientId } }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);

			expect(queryHistory('select', 'directus_oauth_clients')).toHaveLength(0);
		});

		it('missing redirect_uri returns non-redirectable invalid_request', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() => service.validateAuthorization(validParams({ redirect_uri: undefined }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: false },
			);
		});

		it('object resource returns redirectable invalid_request after redirect_uri validation', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(
				() =>
					service.validateAuthorization(validParams({ resource: { nested: TEST_RESOURCE_URL } }), userId, sessionHash),
				{ error: 'invalid_request', redirectable: true },
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

		it('CIMD client returns registration_type cimd and client_domain', async () => {
			const cimdId = 'https://tools.example.com/meta';

			mockDetectClientIdType.mockReturnValue('cimd');

			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_CIMD_ENABLED: true,
			} as any);

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing CIMD client with fresh cache
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdId,
					client_name: 'CIMD Tool',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					grant_types: JSON.stringify(['authorization_code']),
					token_endpoint_auth_method: 'none',
					metadata_expires_at: new Date(Date.now() + 3600_000),
					metadata_fetched_at: new Date(),
					registration_type: 'cimd',
				},
			]);

			const result = await service.validateAuthorization(
				{
					client_id: cimdId,
					redirect_uri: TEST_REDIRECT_URI,
					response_type: 'code',
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					scope: 'mcp:access',
					resource: TEST_RESOURCE_URL,
				},
				userId,
				sessionHash,
			);

			expect(result.registration_type).toBe('cimd');
			expect(result.client_domain).toBe('tools.example.com');
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

		it('accepts redirect_uris already deserialized by the database driver', async () => {
			mockClientLookup(clientId, { redirect_uris: [TEST_REDIRECT_URI] });
			tracker.on.insert('directus_oauth_codes').response([]);
			tracker.on.select('directus_oauth_consents').response([]);
			tracker.on.insert('directus_oauth_consents').response([]);

			const url = await service.processDecision({ signed_params: signConsent(), approved: true }, userId, sessionToken);
			const parsed = new URL(url);

			expect(parsed.searchParams.get('code')).toBeDefined();
		});

		it.each([
			{ host: 'localhost', registered: 'http://localhost/callback', requested: 'http://localhost:54771/callback' },
			{ host: '127.0.0.1', registered: 'http://127.0.0.1/callback', requested: 'http://127.0.0.1:8080/callback' },
			{ host: '[::1]', registered: 'http://[::1]/callback', requested: 'http://[::1]:9999/callback' },
		])(
			'RFC 8252 Section 7.3: processDecision accepts $host redirect_uri with different port',
			async ({ registered, requested }) => {
				mockClientLookup(clientId, { redirect_uris: JSON.stringify([registered]) });
				tracker.on.insert('directus_oauth_codes').response([]);
				tracker.on.select('directus_oauth_consents').response([]);
				tracker.on.insert('directus_oauth_consents').response([]);

				const signed = signConsent({ redirect_uri: requested });

				const url = await service.processDecision({ signed_params: signed, approved: true }, userId, sessionToken);
				const parsed = new URL(url);

				expect(parsed.searchParams.get('code')).toBeDefined();
			},
		);

		it('denial returns redirect URL with error=access_denied, state, iss', async () => {
			mockClientLookup(clientId);

			const signed = signConsent();
			const url = await service.processDecision({ signed_params: signed, approved: false }, userId, sessionToken);
			const parsed = new URL(url);

			expect(parsed.searchParams.get('error')).toBe('access_denied');
			expect(parsed.searchParams.get('state')).toBe('test-state');
			expect(parsed.searchParams.get('iss')).toBe(TEST_PUBLIC_URL);
			expect(parsed.searchParams.has('code')).toBe(false);
		});

		it('denial re-validates redirect_uri before redirecting', async () => {
			mockClientLookup(clientId, { redirect_uris: JSON.stringify(['http://localhost/callback']) });

			const signed = signConsent({ redirect_uri: 'http://localhost:54771/callback#fragment' });

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: false }, userId, sessionToken),
				{ error: 'invalid_redirect_uri' },
			);
		});

		it('denial rejects stale redirect_uri removed since consent', async () => {
			mockClientLookup(clientId, { redirect_uris: JSON.stringify(['https://other.example.com/callback']) });

			const signed = signConsent();

			await assertOAuthError(
				() => service.processDecision({ signed_params: signed, approved: false }, userId, sessionToken),
				{ error: 'invalid_request' },
			);
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

			tracker.on.insert('directus_oauth_codes').response([]);

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

		it('code creation and consent upsert use one transaction boundary', async () => {
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
		function mockSuccessfulExchange(clientOverrides: Record<string, unknown> = {}) {
			// 0. Client lookup (pre-txn auth + in-txn re-read, persistent handler serves both)
			mockClientLookup(clientId, clientOverrides);
			// 1. Code lookup (read-only, outside transaction)
			mockCodeLookup();
			// 2. Atomic burn (inside transaction)
			tracker.on.update('directus_oauth_codes').response(1);
			// 3. User lookup for email + status (inside transaction)
			mockUserLookup();
			// 4. Existing grant lookup (none found)
			tracker.on.select('directus_oauth_tokens').response([]);
			// 5. Insert session
			tracker.on.insert('directus_sessions').response([]);
			// 6. Insert grant
			tracker.on.insert('directus_oauth_tokens').response([]);
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it.each([
			[{ grant_type: undefined }, 'grant_type', true],
			[{ code: undefined }, 'code', true],
			[{ redirect_uri: undefined }, 'redirect_uri', true],
			[{ code_verifier: undefined }, 'code_verifier', true],
			[{ client_id: undefined }, 'client_id', false],
		])('missing %s returns invalid_request', async (override, _param, needsMock) => {
			if (needsMock) {
				mockClientLookup(clientId);
			}

			await assertOAuthError(() => service.exchangeCode(validParams(override), context), {
				error: 'invalid_request',
			});
		});

		it('unsupported grant_type returns unsupported_grant_type', async () => {
			mockClientLookup(clientId);

			await assertOAuthError(() => service.exchangeCode(validParams({ grant_type: 'client_credentials' }), context), {
				error: 'unsupported_grant_type',
			});
		});

		it('malformed code_verifier (too short) returns invalid_request after client auth', async () => {
			mockClientLookup(clientId);

			// 42 chars - below minimum of 43
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(42) }), context), {
				error: 'invalid_request',
			});

			// Only client lookup query should have been made (pre-txn auth)
			expect(queryHistory('select', 'directus_oauth_clients').length).toBe(1);
			expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
		});

		it('malformed code_verifier (too long) returns invalid_request after client auth', async () => {
			mockClientLookup(clientId);

			// 129 chars - above maximum of 128
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(129) }), context), {
				error: 'invalid_request',
			});

			expect(queryHistory('select', 'directus_oauth_clients').length).toBe(1);
			expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
		});

		it('malformed code_verifier (invalid charset) returns invalid_request after client auth', async () => {
			mockClientLookup(clientId);

			// 43 chars but contains space (not unreserved per RFC 7636)
			await assertOAuthError(
				() => service.exchangeCode(validParams({ code_verifier: 'a'.repeat(42) + ' ' }), context),
				{ error: 'invalid_request' },
			);

			expect(queryHistory('select', 'directus_oauth_clients').length).toBe(1);
			expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
		});

		it('malformed code_verifier returns invalid_request even when code is valid (format check runs first)', async () => {
			mockClientLookup(clientId);

			// Set up valid code in DB but provide bad verifier - should not touch DB for code
			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: 'a!b'.repeat(15) }), context), {
				error: 'invalid_request',
			});

			expect(queryHistory('select', 'directus_oauth_clients').length).toBe(1);
			expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
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

		it('accepts grant_types already deserialized by the database driver', async () => {
			mockSuccessfulExchange({ grant_types: ['authorization_code', 'refresh_token'] });

			const result = await service.exchangeCode(validParams(), context);

			expect(result.access_token).toBeDefined();
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
			mockClientLookup(clientId);
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);

			// Valid format but wrong verifier
			const wrongVerifier = 'x'.repeat(43);

			await assertOAuthError(() => service.exchangeCode(validParams({ code_verifier: wrongVerifier }), context), {
				error: 'invalid_grant',
			});
		});

		it('expired code returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockCodeLookup({ expires_at: new Date(Date.now() - 1000) }); // expired 1s ago
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong client_id returns invalid_grant', async () => {
			mockClientLookup(clientId);
			const wrongClientId = crypto.randomUUID();
			mockCodeLookup({ client: wrongClientId });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong redirect_uri returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockCodeLookup({ redirect_uri: 'https://other.example.com/callback' });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });
		});

		it('wrong resource returns invalid_target', async () => {
			mockClientLookup(clientId);
			mockCodeLookup({ resource: 'https://evil.com/mcp' });
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_target' });
		});

		it('missing resource defaults to code resource when MCP_OAUTH_REQUIRE_RESOURCE=false', async () => {
			mockSuccessfulExchange();

			const result = await service.exchangeCode(validParams({ resource: undefined }), context);
			expect(result.access_token).toBeDefined();
		});

		it('code already used returns invalid_grant without revoking public-client grant', async () => {
			mockClientLookup(clientId);
			mockCodeLookup();
			// Atomic update returns 0 = already used
			tracker.on.update('directus_oauth_codes').response(0);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), { error: 'invalid_grant' });

			expect(queryHistory('select', 'directus_oauth_tokens')).toHaveLength(0);
			expect(queryHistory('delete', 'directus_oauth_tokens')).toHaveLength(0);
			expect(queryHistory('delete', 'directus_sessions')).toHaveLength(0);
		});

		describe.each(confidentialMethods)('$label code replay', ({ method, makeAuthParams }) => {
			const clientSecret = 'super-secret-value';
			const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

			it('revokes the confidential-client grant and session', async () => {
				mockClientLookup(clientId, {
					token_endpoint_auth_method: method,
					client_secret_hash: clientSecretHash,
				});

				mockCodeLookup();
				tracker.on.update('directus_oauth_codes').response(0);

				tracker.on.select('directus_oauth_tokens').response([
					{
						id: 'winner-grant',
						client: clientId,
						session: 'winner-session-hash',
						code_hash: codeHash,
					},
				]);

				tracker.on.delete('directus_oauth_tokens').response(1);
				tracker.on.delete('directus_sessions').response(1);

				await assertOAuthError(
					() => service.exchangeCode(validParams(makeAuthParams(clientId, clientSecret)), context),
					{ error: 'invalid_grant' },
				);

				expect(queryHistory('select', 'directus_oauth_tokens')).toHaveLength(1);
				expect(queryHistory('delete', 'directus_oauth_tokens')).toHaveLength(1);
				expect(queryHistory('delete', 'directus_sessions')).toHaveLength(1);
			});
		});

		it('concurrent code exchange - only one wins (atomic UPDATE)', async () => {
			mockClientLookup(clientId);
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

		it('code exchange burns the code and creates a grant', async () => {
			mockSuccessfulExchange();

			await service.exchangeCode(validParams(), context);

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
			mockClientLookup(clientId);
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

		it('exchange replacing an existing grant burns, cleans up, and creates a new grant', async () => {
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

		it('client deleted between pre-txn auth and in-txn re-read rejects with invalid_grant', async () => {
			let clientSelectCount = 0;

			tracker.on.select('directus_oauth_clients').response(() => {
				clientSelectCount++;

				if (clientSelectCount === 1) {
					// Pre-txn auth: client exists
					return [
						{
							client_id: clientId,
							client_name: 'Test MCP Client',
							redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
							grant_types: JSON.stringify(['authorization_code', 'refresh_token']),
							token_endpoint_auth_method: 'none',
						},
					];
				}

				return []; // In-txn re-read: client deleted
			});

			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);

			await assertOAuthError(() => service.exchangeCode(validParams(), context), {
				error: 'invalid_grant',
			});
		});

		it('inactive user returns invalid_grant', async () => {
			mockClientLookup(clientId);
			mockCodeLookup();
			tracker.on.update('directus_oauth_codes').response(1);
			// User exists but is suspended
			mockUserLookup({ status: 'suspended' });

			await assertOAuthError(() => service.exchangeCode(validParams(), context), {
				error: 'invalid_grant',
			});
		});

		describe('client authentication', () => {
			const clientSecret = 'super-secret-value';
			const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

			describe.each(confidentialMethods)('$label', ({ method, makeAuthParams }) => {
				it('valid secret succeeds', async () => {
					mockSuccessfulExchange({
						token_endpoint_auth_method: method,
						client_secret_hash: clientSecretHash,
					});

					const result = await service.exchangeCode(validParams(makeAuthParams(clientId, clientSecret)), context);

					expect(result.access_token).toBeDefined();
					expect(result.token_type).toBe('Bearer');
				});

				it('wrong secret rejects before code burn', async () => {
					mockClientLookup(clientId, {
						token_endpoint_auth_method: method,
						client_secret_hash: clientSecretHash,
					});

					await assertOAuthError(
						() => service.exchangeCode(validParams(makeAuthParams(clientId, 'wrong-secret')), context),
						{ error: 'invalid_client', statusCode: 401 },
					);

					expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
				});
			});

			it('client_secret_basic: missing header rejects before code burn', async () => {
				// Only mock client lookup -- no code mocks. If code ops are reached, test fails.
				mockClientLookup(clientId, {
					token_endpoint_auth_method: 'client_secret_basic',
					client_secret_hash: clientSecretHash,
				});

				await assertOAuthError(() => service.exchangeCode(validParams(), context), {
					error: 'invalid_client',
					statusCode: 401,
				});

				// No code operations should have been attempted
				expect(queryHistory('select', 'directus_oauth_codes').length).toBe(0);
				expect(queryHistory('update', 'directus_oauth_codes').length).toBe(0);
			});

			it('none: still works unchanged', async () => {
				mockSuccessfulExchange({ token_endpoint_auth_method: 'none' });

				const result = await service.exchangeCode(validParams(), context);
				expect(result.access_token).toBeDefined();
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

		function mockSessionConsumed() {
			tracker.on.delete('directus_sessions').response(1);
		}

		function mockSuccessfulRefresh(clientOverrides: Record<string, unknown> = {}) {
			// 1. Client lookup
			mockClientLookup(clientId, clientOverrides);
			// 2. Grant lookup by session
			mockGrantLookup();
			// 3. User status + email lookup
			tracker.on.select('directus_users').response([createUserRow()]);
			// 4. Consume the live backing session
			mockSessionConsumed();
			// 5. Atomic update (session rotation)
			tracker.on.update('directus_oauth_tokens').response(1);
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

		it('accepts grant_types already deserialized by the database driver', async () => {
			mockSuccessfulRefresh({ grant_types: ['authorization_code', 'refresh_token'] });

			const result = await service.refreshToken(validParams(), context);

			expect(result.access_token).toBeDefined();
		});

		it('rotation: old session deleted, new session created, grant pointer updated', async () => {
			mockSuccessfulRefresh();

			const result = await service.refreshToken(validParams(), context);

			// Old session deleted
			const deletes = queryHistory('delete', 'directus_sessions');
			expect(deletes.length).toBe(1);
			expect(deletes[0]!.bindings).toContain(sessionHash);
			expect(deletes[0]!.bindings).toContain(userId);
			expect(deletes[0]!.bindings).toContain(clientId);

			// New session created
			const sessionInserts = queryHistory('insert', 'directus_sessions');
			expect(sessionInserts.length).toBe(1);

			// Grant updated (atomic UPDATE WHERE session = old_hash)
			const updates = queryHistory('update', 'directus_oauth_tokens');
			expect(updates.length).toBe(1);
			expect(updates[0]!.bindings).toContain(grantId);
			expect(updates[0]!.bindings).toContain(sessionHash); // WHERE clause has old hash
			expect(updates[0]!.bindings).toContain(clientId);

			// New refresh token returned
			expect(result.refresh_token).toBeDefined();
			expect(result.refresh_token).not.toBe(rawSessionToken);
		});

		it('orphaned grant without backing session returns invalid_grant and deletes grant', async () => {
			mockClientLookup(clientId);

			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) {
					return [createGrantRow({ id: grantId, client: clientId, user: userId, session: sessionHash })];
				}

				return [createGrantRow({ id: grantId, client: clientId, user: userId, session: sessionHash })];
			});

			tracker.on.select('directus_users').response([createUserRow()]);
			tracker.on.delete('directus_sessions').response(0);
			tracker.on.delete('directus_oauth_tokens').response(1);

			await assertOAuthError(() => service.refreshToken(validParams(), context), {
				error: 'invalid_grant',
				statusCode: 400,
			});

			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			expect(tokenDeletes.length).toBe(1);
			expect(tokenDeletes[0]!.bindings).toContain(grantId);
			expect(tokenDeletes[0]!.bindings).toContain(sessionHash);
			expect(tokenDeletes[0]!.bindings).toContain(clientId);
			expect(queryHistory('update', 'directus_oauth_tokens').length).toBe(0);
			expect(queryHistory('insert', 'directus_sessions').length).toBe(0);
			expect(mockFetchRolesTree).not.toHaveBeenCalled();
			expect(mockActivityCreateOne).not.toHaveBeenCalled();
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
			// Consume the live backing session
			mockSessionConsumed();

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
			// Consume the live backing session
			mockSessionConsumed();

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
			expect(tokenDeletes[0]!.bindings).toContain(grantId);
			expect(tokenDeletes[0]!.bindings).toContain(sessionHash);
			expect(tokenDeletes[0]!.bindings).toContain(clientId);

			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(sessionDeletes.length).toBe(1);
			expect(sessionDeletes[0]!.bindings).toContain('new-hash');
			expect(sessionDeletes[0]!.bindings).toContain(userId);
			expect(sessionDeletes[0]!.bindings).toContain(clientId);
		});

		it('reuse detection lookup is scoped to the authenticated client', async () => {
			mockClientLookup(clientId);

			let tokenSelectCount = 0;

			tracker.on.select('directus_oauth_tokens').response(() => {
				tokenSelectCount++;

				if (tokenSelectCount === 1) return [];

				return [];
			});

			await assertOAuthError(() => service.refreshToken(validParams(), context), { error: 'invalid_grant' });

			const tokenSelects = queryHistory('select', 'directus_oauth_tokens');
			expect(tokenSelects[1]!.sql).toContain('previous_session');
			expect(tokenSelects[1]!.sql).toContain('client');
			expect(tokenSelects[1]!.bindings).toContain(sessionHash);
			expect(tokenSelects[1]!.bindings).toContain(clientId);
			expect(queryHistory('delete', 'directus_oauth_tokens').length).toBe(0);
			expect(queryHistory('delete', 'directus_sessions').length).toBe(0);
		});

		it('reuse detection deletes grant and session through one transaction boundary', async () => {
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

			// Keep one smoke assertion that the revoke path still enters the transaction helper.
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
			mockSuccessfulRefresh();

			await assertOAuthError(() => service.refreshToken(validParams({ scope: 'openid' }), context), {
				error: 'invalid_scope',
			});
		});

		it('scope on refresh request rejects scopes outside the original grant', async () => {
			mockSuccessfulRefresh();

			await assertOAuthError(() => service.refreshToken(validParams({ scope: 'mcp:access openid' }), context), {
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
					token_endpoint_auth_method: 'none',
				},
			]);

			// Grant belongs to original clientId, not otherClientId
			mockGrantLookup();

			await assertOAuthError(() => service.refreshToken(validParams({ client_id: otherClientId }), context), {
				error: 'invalid_grant',
				statusCode: 400,
			});
		});

		describe('client authentication', () => {
			const clientSecret = 'super-secret-value';
			const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

			describe.each(confidentialMethods)('$label', ({ method, makeAuthParams }) => {
				it('valid secret succeeds', async () => {
					// 1. Client lookup
					mockClientLookup(clientId, {
						token_endpoint_auth_method: method,
						client_secret_hash: clientSecretHash,
					});

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

					const result = await service.refreshToken(validParams(makeAuthParams(clientId, clientSecret)), context);

					expect(result.access_token).toBeDefined();
					expect(result.token_type).toBe('Bearer');
					expect(result.refresh_token).toBeDefined();
				});

				it('wrong secret rejects with 401', async () => {
					mockClientLookup(clientId, {
						token_endpoint_auth_method: method,
						client_secret_hash: clientSecretHash,
					});

					await assertOAuthError(
						() => service.refreshToken(validParams(makeAuthParams(clientId, 'wrong-secret')), context),
						{ error: 'invalid_client', statusCode: 401 },
					);

					// No grant operations should have been attempted
					expect(queryHistory('select', 'directus_oauth_tokens').length).toBe(0);
				});
			});

			it('none: still works unchanged', async () => {
				mockSuccessfulRefresh();

				const result = await service.refreshToken(validParams(), context);
				expect(result.access_token).toBeDefined();
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

		it('unknown client_id returns 401 invalid_client', async () => {
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.revokeToken(validParams()), {
				error: 'invalid_client',
				statusCode: 401,
			});
		});

		it('unknown token returns 200', async () => {
			mockClientLookup(clientId);
			tracker.on.select('directus_oauth_tokens').response([]);

			await service.revokeToken(validParams());
		});

		it.each(['refresh_token', 'access_token', 'unknown_token_type'])(
			'token_type_hint=%s does not change revocation behavior',
			async (tokenTypeHint) => {
				mockClientLookup(clientId);
				mockGrantLookup();
				tracker.on.delete('directus_oauth_tokens').response(1);
				tracker.on.delete('directus_sessions').response(1);
				tracker.on.select('directus_users').response([createUserRow()]);

				await service.revokeToken({ ...validParams(), token_type_hint: tokenTypeHint });

				expect(queryHistory('delete', 'directus_oauth_tokens')).toHaveLength(1);
				expect(queryHistory('delete', 'directus_sessions')).toHaveLength(1);
			},
		);

		it('missing token parameter returns invalid_request', async () => {
			mockClientLookup(clientId);

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

		it('revocation deletes grant and session through one transaction boundary', async () => {
			mockClientLookup(clientId);
			mockGrantLookup();
			tracker.on.delete('directus_oauth_tokens').response(1);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.select('directus_users').response([createUserRow()]);

			const transactionSpy = vi.spyOn(db, 'transaction');

			await service.revokeToken(validParams());

			// Keep one smoke assertion that the revoke path still enters the transaction helper.
			expect(transactionSpy).toHaveBeenCalledOnce();

			// Verify both deletes still happened
			const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
			const sessionDeletes = queryHistory('delete', 'directus_sessions');
			expect(tokenDeletes.length).toBe(1);
			expect(sessionDeletes.length).toBe(1);
		});
	});

	describe('revokeToken with confidential client', () => {
		let service: McpOAuthService;
		const userId = crypto.randomUUID();
		const clientId = crypto.randomUUID();
		const grantId = crypto.randomUUID();
		const rawSessionToken = 'd'.repeat(64);
		const sessionHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
		const clientSecret = 'revoke-secret-value';
		const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

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

		describe.each(confidentialMethods)('$label', ({ method, makeAuthParams }) => {
			it('valid secret succeeds', async () => {
				mockClientLookup(clientId, {
					token_endpoint_auth_method: method,
					client_secret_hash: clientSecretHash,
				});

				mockGrantLookup();
				tracker.on.delete('directus_oauth_tokens').response(1);
				tracker.on.delete('directus_sessions').response(1);
				tracker.on.select('directus_users').response([createUserRow()]);

				await service.revokeToken(validParams(makeAuthParams(clientId, clientSecret)));

				const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
				expect(tokenDeletes.length).toBe(1);
				const sessionDeletes = queryHistory('delete', 'directus_sessions');
				expect(sessionDeletes.length).toBe(1);
			});

			it('wrong secret rejects with 401', async () => {
				mockClientLookup(clientId, {
					token_endpoint_auth_method: method,
					client_secret_hash: clientSecretHash,
				});

				await assertOAuthError(() => service.revokeToken(validParams(makeAuthParams(clientId, 'wrong-secret'))), {
					error: 'invalid_client',
					statusCode: 401,
				});

				// Grant should NOT have been revoked
				const tokenDeletes = queryHistory('delete', 'directus_oauth_tokens');
				expect(tokenDeletes.length).toBe(0);
			});
		});

		it('client_secret_basic: auth succeeds but token unknown returns 200', async () => {
			mockClientLookup(clientId, {
				token_endpoint_auth_method: 'client_secret_basic',
				client_secret_hash: clientSecretHash,
			});

			// No grant found
			tracker.on.select('directus_oauth_tokens').response([]);

			// Should NOT throw -- silent 200 per RFC 7009
			await service.revokeToken(validParams(confidentialMethods[0]!.makeAuthParams(clientId, clientSecret)));
		});

		it('unknown client_id returns 401', async () => {
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.revokeToken(validParams()), { error: 'invalid_client', statusCode: 401 });
		});

		it('none: still returns 200 for unknown tokens', async () => {
			mockClientLookup(clientId, {
				token_endpoint_auth_method: 'none',
				client_secret_hash: null,
			});

			tracker.on.select('directus_oauth_tokens').response([]);

			// Should NOT throw -- silent 200
			await service.revokeToken(validParams());
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

		it('never-authorized client cleanup query applies unused TTL cutoff', async () => {
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

			const clientSelects = queryHistory('select', 'directus_oauth_clients');
			expect(clientSelects[0]!.sql).toContain('date_created');
		});

		it('idle authorized client cleanup is skipped when idle TTL is disabled', async () => {
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

			const clientSelects = queryHistory('select', 'directus_oauth_clients');
			expect(clientSelects).toHaveLength(1);
		});

		it('idle authorized client cleanup deletes clients returned by the eligibility query', async () => {
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

				const clientSelects = queryHistory('select', 'directus_oauth_clients');
				expect(clientSelects[1]!.sql).toContain('date_created');
			} finally {
				env['MCP_OAUTH_CLIENT_IDLE_TTL'] = originalIdleTtl;
			}
		});

		it('idle authorized client cleanup query applies idle TTL cutoff', async () => {
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

				const clientSelects = queryHistory('select', 'directus_oauth_clients');
				expect(clientSelects[1]!.sql).toContain('date_created');
			} finally {
				env['MCP_OAUTH_CLIENT_IDLE_TTL'] = originalIdleTtl;
			}
		});

		it('client cleanup eligibility excludes clients with active sessions in the query', async () => {
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

			const clientSelects = queryHistory('select', 'directus_oauth_clients');
			expect(clientSelects[0]!.sql).toContain('directus_sessions');
			expect(clientSelects[0]!.sql).toContain('directus_oauth_tokens');
		});
	});

	describe('resolveClientWithFetch', () => {
		let service: McpOAuthService;
		const cimdClientId = 'https://tools.example.com/oauth/metadata.json';
		const dcrClientId = crypto.randomUUID();

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('DCR UUID lookup returns client row', async () => {
			mockDetectClientIdType.mockReturnValue('dcr');

			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: dcrClientId,
					client_name: 'Test DCR Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					grant_types: JSON.stringify(['authorization_code']),
				},
			]);

			const result = await service.resolveClientWithFetch(dcrClientId);
			expect(result['client_id']).toBe(dcrClientId);
			expect(result['client_name']).toBe('Test DCR Client');
			expect(mockValidateCimdHostnameEgress).not.toHaveBeenCalled();
		});

		it('DCR UUID not found throws error', async () => {
			mockDetectClientIdType.mockReturnValue('dcr');
			tracker.on.select('directus_oauth_clients').response([]);

			await assertOAuthError(() => service.resolveClientWithFetch(dcrClientId), {
				error: 'invalid_request',
			});
		});

		it('null client_id type throws error', async () => {
			mockDetectClientIdType.mockReturnValue(null);

			await assertOAuthError(() => service.resolveClientWithFetch('https://example.com/'), {
				error: 'invalid_request',
			});
		});

		it('CIMD fresh cache hit returns existing row (no fetch)', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing client with future expiry
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Cached CIMD Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: new Date(Date.now() + 3600_000),
					metadata_fetched_at: new Date(),
					registration_type: 'cimd',
				},
			]);

			const result = await service.resolveClientWithFetch(cimdClientId);
			expect(result['client_name']).toBe('Cached CIMD Client');
			expect(mockValidateCimdHostnameEgress).not.toHaveBeenCalled();
			expect(mockFetchCimdMetadata).not.toHaveBeenCalled();
		});

		it('CIMD first contact inserts new client', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// No existing client, then max clients cap
			tracker.on.select('directus_oauth_clients').responseOnce([]);
			tracker.on.select('directus_oauth_clients').responseOnce([{ count: 0 }]);

			// fetchCimdMetadata returns valid metadata
			mockFetchCimdMetadata.mockResolvedValue({
				notModified: false,
				metadata: {
					client_id: cimdClientId,
					client_name: 'New CIMD Client',
					redirect_uris: [TEST_REDIRECT_URI],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
				},
				etag: '"abc123"',
				ttlMs: 3600_000,
			});

			tracker.on.insert('directus_oauth_clients').response([]);

			const result = await service.resolveClientWithFetch(cimdClientId);
			expect(result['client_id']).toBe(cimdClientId);
			expect(result['client_name']).toBe('New CIMD Client');
			expect(result['registration_type']).toBe('cimd');
			expect(mockFetchCimdMetadata).toHaveBeenCalledWith(cimdClientId);
		});

		it('CIMD stale cache triggers re-fetch (200)', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing client with past expiry (stale)
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Stale Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: new Date(Date.now() - 1000),
					metadata_fetched_at: new Date(Date.now() - 3600_000),
					metadata_etag: '"old-etag"',
					registration_type: 'cimd',
				},
			]);

			// Re-fetch returns 200 with updated metadata
			mockFetchCimdMetadata.mockResolvedValue({
				notModified: false,
				metadata: {
					client_id: cimdClientId,
					client_name: 'Updated Client',
					redirect_uris: [TEST_REDIRECT_URI],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
				},
				etag: '"new-etag"',
				ttlMs: 3600_000,
			});

			tracker.on.update('directus_oauth_clients').response(1);

			const result = await service.resolveClientWithFetch(cimdClientId);
			expect(result['client_name']).toBe('Updated Client');
			expect(mockFetchCimdMetadata).toHaveBeenCalledWith(cimdClientId, '"old-etag"');
		});

		it('CIMD stale cache with 304 updates timestamps only', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing client with past expiry (stale)
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Existing Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: new Date(Date.now() - 1000),
					metadata_fetched_at: new Date(Date.now() - 3600_000),
					metadata_etag: '"etag-1"',
					registration_type: 'cimd',
				},
			]);

			// Re-fetch returns 304
			mockFetchCimdMetadata.mockResolvedValue({
				notModified: true,
				ttlMs: 7200_000,
			});

			tracker.on.update('directus_oauth_clients').response(1);

			const result = await service.resolveClientWithFetch(cimdClientId);
			// Name stays the same (304 = no content change)
			expect(result['client_name']).toBe('Existing Client');
			expect(mockFetchCimdMetadata).toHaveBeenCalledWith(cimdClientId, '"etag-1"');
		});

		it('CIMD disabled in env throws error', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			await assertOAuthError(() => service.resolveClientWithFetch(cimdClientId), {
				error: 'invalid_client',
			});
		});

		it('CIMD disabled in settings throws error', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: false }]);

			await assertOAuthError(() => service.resolveClientWithFetch(cimdClientId), {
				error: 'invalid_client',
			});
		});

		it('CIMD domain not in allowlist throws error', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');
			mockGetAllowedDomains.mockReturnValue(['allowed.com']);
			mockIsDomainAllowed.mockReturnValue(false);

			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			await assertOAuthError(() => service.resolveClientWithFetch(cimdClientId), {
				error: 'invalid_client',
			});
		});

		it('CIMD max clients exceeded throws error', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// No existing client, then max clients reached
			tracker.on.select('directus_oauth_clients').responseOnce([]);
			tracker.on.select('directus_oauth_clients').responseOnce([{ count: 10000 }]);

			await assertOAuthError(() => service.resolveClientWithFetch(cimdClientId), {
				error: 'invalid_client',
			});
		});

		it('CIMD stale cache fetch failure (non-OAuthError) throws invalid_client', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing client with past expiry (stale)
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Stale Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: new Date(Date.now() - 1000),
					metadata_fetched_at: new Date(Date.now() - 3600_000),
					metadata_etag: '"old-etag"',
					registration_type: 'cimd',
				},
			]);

			// fetchCimdMetadata rejects with a generic (non-OAuthError) error
			mockFetchCimdMetadata.mockRejectedValue(new Error('Network error'));

			try {
				await service.resolveClientWithFetch(cimdClientId);
				expect.fail('Expected OAuthError to be thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).code).toBe('invalid_client');
				expect((err as OAuthError).description).toBe('Failed to revalidate client metadata');
			}
		});

		it('CIMD stale 304 with null TTL reuses previous TTL', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			const fetchedAt = new Date(Date.now() - 3600_000);
			const expiresAt = new Date(fetchedAt.getTime() + 3600_000); // 1h TTL
			const prevTtl = expiresAt.getTime() - fetchedAt.getTime(); // 3600000

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// Existing client with past expiry (stale) and known previous TTL
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Existing Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: expiresAt,
					metadata_fetched_at: fetchedAt,
					metadata_etag: '"etag-1"',
					registration_type: 'cimd',
				},
			]);

			// 304 with null TTL (no Cache-Control on response)
			mockFetchCimdMetadata.mockResolvedValue({
				notModified: true,
				ttlMs: null,
			});

			tracker.on.update('directus_oauth_clients').response(1);

			const result = await service.resolveClientWithFetch(cimdClientId);

			// The new metadata_expires_at should be ~1h from now (reused previous TTL)
			const resultExpiresAt = new Date(result['metadata_expires_at'] as string).getTime();
			const resultFetchedAt = new Date(result['metadata_fetched_at'] as string).getTime();
			const actualTtl = resultExpiresAt - resultFetchedAt;

			expect(actualTtl).toBe(prevTtl);
		});

		it('CIMD stale 304 with null TTL preserves previous zero TTL', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			const fetchedAt = new Date(Date.now() - 3600_000);
			const expiresAt = fetchedAt;

			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'Existing Client',
					redirect_uris: JSON.stringify([TEST_REDIRECT_URI]),
					metadata_expires_at: expiresAt,
					metadata_fetched_at: fetchedAt,
					metadata_etag: '"etag-1"',
					registration_type: 'cimd',
				},
			]);

			mockFetchCimdMetadata.mockResolvedValue({
				notModified: true,
				ttlMs: null,
			});

			tracker.on.update('directus_oauth_clients').response(1);

			const result = await service.resolveClientWithFetch(cimdClientId);

			const resultExpiresAt = new Date(result['metadata_expires_at'] as string).getTime();
			const resultFetchedAt = new Date(result['metadata_fetched_at'] as string).getTime();

			expect(resultExpiresAt - resultFetchedAt).toBe(0);
		});

		it('CIMD 304 on first contact (no existing row) throws invalid_client_metadata', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// No existing client, then max clients cap
			tracker.on.select('directus_oauth_clients').responseOnce([]);
			tracker.on.select('directus_oauth_clients').responseOnce([{ count: 0 }]);

			// fetchCimdMetadata returns 304 (unexpected on first contact)
			mockFetchCimdMetadata.mockResolvedValue({
				notModified: true,
				ttlMs: null,
			});

			try {
				await service.resolveClientWithFetch(cimdClientId);
				expect.fail('Expected OAuthError to be thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).code).toBe('invalid_client_metadata');
				expect((err as OAuthError).description).toContain('Unexpected 304');
			}
		});

		it('CIMD concurrent insert falls back to SELECT', async () => {
			mockDetectClientIdType.mockReturnValue('cimd');

			// Settings gate
			tracker.on.select('directus_settings').response([{ mcp_oauth_cimd_enabled: true }]);

			// No existing client, then max clients cap, then fallback SELECT after concurrent insert
			tracker.on.select('directus_oauth_clients').responseOnce([]);
			tracker.on.select('directus_oauth_clients').responseOnce([{ count: 0 }]);

			mockFetchCimdMetadata.mockResolvedValue({
				notModified: false,
				metadata: {
					client_id: cimdClientId,
					client_name: 'CIMD Client',
					redirect_uris: [TEST_REDIRECT_URI],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
				},
				etag: '"abc"',
				ttlMs: 3600_000,
			});

			// INSERT throws unique constraint violation
			const dbError = new Error('duplicate key value violates unique constraint');
			tracker.on.insert('directus_oauth_clients').simulateError(dbError);

			// translateDatabaseError returns RecordNotUniqueError
			mockTranslateDatabaseError.mockResolvedValue(
				new RecordNotUniqueError({ collection: 'directus_oauth_clients', field: 'client_id' }),
			);

			// Fallback SELECT after concurrent insert
			tracker.on.select('directus_oauth_clients').response([
				{
					client_id: cimdClientId,
					client_name: 'CIMD Client',
					registration_type: 'cimd',
				},
			]);

			const result = await service.resolveClientWithFetch(cimdClientId);
			expect(result['client_id']).toBe(cimdClientId);
		});
	});

	describe('resolveClientFromDb', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('returns client row when found', async () => {
			const clientId = crypto.randomUUID();

			tracker.on
				.select('directus_oauth_clients')
				.response([{ client_id: clientId, client_name: 'Test', registration_type: 'dcr' }]);

			const result = await service.resolveClientFromDb(clientId);
			expect(result).toBeDefined();
			expect(result!['client_id']).toBe(clientId);
		});

		it('returns undefined when not found', async () => {
			tracker.on.select('directus_oauth_clients').response([]);

			const result = await service.resolveClientFromDb('nonexistent');
			expect(result).toBeUndefined();
		});

		it('does NOT gate on CIMD enabled (drain-naturally)', async () => {
			const cimdClientId = 'https://tools.example.com/metadata';

			tracker.on.select('directus_oauth_clients').response([{ client_id: cimdClientId, registration_type: 'cimd' }]);

			// Even with CIMD disabled, resolveClientFromDb should still work
			const { useEnv } = vi.mocked(await import('@directus/env'));

			useEnv.mockReturnValue({
				PUBLIC_URL: TEST_PUBLIC_URL,
				MCP_OAUTH_CIMD_ENABLED: false,
			} as any);

			const result = await service.resolveClientFromDb(cimdClientId);
			expect(result).toBeDefined();
			expect(result!['registration_type']).toBe('cimd');
		});
	});

	describe('parseBasicAuth', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('parses valid Basic header', () => {
			const encoded = Buffer.from('my-client:my-secret').toString('base64');
			const result = service.parseBasicAuth(`Basic ${encoded}`);
			expect(result).toEqual({ clientId: 'my-client', clientSecret: 'my-secret' });
		});

		it('URL-decodes client_id and secret', () => {
			const encoded = Buffer.from('my%20client:my%20secret').toString('base64');
			const result = service.parseBasicAuth(`Basic ${encoded}`);
			expect(result).toEqual({ clientId: 'my client', clientSecret: 'my secret' });
		});

		it('handles secrets containing colons', () => {
			const encoded = Buffer.from('client:secret:with:colons').toString('base64');
			const result = service.parseBasicAuth(`Basic ${encoded}`);
			expect(result).toEqual({ clientId: 'client', clientSecret: 'secret:with:colons' });
		});

		it('returns null for non-Basic scheme', () => {
			expect(service.parseBasicAuth('Bearer token')).toBeNull();
		});

		it('returns null for undefined', () => {
			expect(service.parseBasicAuth(undefined)).toBeNull();
		});

		it.each([
			['Basic !!!not-base64!!!', 'invalid base64'],
			[`Basic ${Buffer.from('no-colon-here').toString('base64')}`, 'missing colon separator'],
			[`Basic ${Buffer.from('client\x00:secret').toString('base64')}`, 'null bytes'],
			[`Basic ${Buffer.from('client%00:secret').toString('base64')}`, 'decoded null bytes'],
			[`Basic ${Buffer.from(':secret').toString('base64')}`, 'empty client_id'],
			[`Basic ${Buffer.from('client%ZZ:secret').toString('base64')}`, 'invalid percent-encoding'],
		])('rejects malformed header: %s', (header) => {
			try {
				service.parseBasicAuth(header);
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('rejects empty payload after Basic prefix', () => {
			try {
				service.parseBasicAuth('Basic ');
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('handles case-insensitive Basic scheme', () => {
			const encoded = Buffer.from('my-client:my-secret').toString('base64');
			expect(service.parseBasicAuth(`basic ${encoded}`)).toEqual({ clientId: 'my-client', clientSecret: 'my-secret' });
			expect(service.parseBasicAuth(`BASIC ${encoded}`)).toEqual({ clientId: 'my-client', clientSecret: 'my-secret' });
		});

		it('decodes + as space (form-urlencoded)', () => {
			const encoded = Buffer.from('my+client:my+secret').toString('base64');
			const result = service.parseBasicAuth(`Basic ${encoded}`);
			expect(result).toEqual({ clientId: 'my client', clientSecret: 'my secret' });
		});

		it('handles URL-based CIMD client_id in Basic header', () => {
			const clientId = 'https://tools.example.com/oauth/metadata.json';
			const encoded = Buffer.from(`${encodeURIComponent(clientId)}:secret`).toString('base64');
			const result = service.parseBasicAuth(`Basic ${encoded}`);
			expect(result!.clientId).toBe(clientId);
			expect(result!.clientSecret).toBe('secret');
		});
	});

	describe('resolveClientId', () => {
		let service: McpOAuthService;

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		it('extracts client_id from body when no Authorization header', () => {
			const result = service.resolveClientId({ client_id: 'my-client' });
			expect(result.clientId).toBe('my-client');
			expect(result.basicAuth).toBeNull();
		});

		it('extracts client_id and secret from Basic auth header', () => {
			const encoded = Buffer.from('my-client:my-secret').toString('base64');
			const result = service.resolveClientId({ authorization_header: `Basic ${encoded}` });
			expect(result.clientId).toBe('my-client');
			expect(result.basicAuth).toEqual({ clientId: 'my-client', clientSecret: 'my-secret' });
		});

		it('ignores non-Basic Authorization headers', () => {
			const result = service.resolveClientId({
				client_id: 'my-client',
				authorization_header: 'Bearer some-token',
			});

			expect(result.clientId).toBe('my-client');
			expect(result.basicAuth).toBeNull();
		});

		it('rejects mismatched client_id between header and body', () => {
			const encoded = Buffer.from('client-a:secret').toString('base64');

			try {
				service.resolveClientId({
					client_id: 'client-b',
					authorization_header: `Basic ${encoded}`,
				});

				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('accepts matching client_id in header and body', () => {
			const encoded = Buffer.from('my-client:secret').toString('base64');

			const result = service.resolveClientId({
				client_id: 'my-client',
				authorization_header: `Basic ${encoded}`,
			});

			expect(result.clientId).toBe('my-client');
		});

		it('rejects empty Basic client_id instead of falling back to body client_id', () => {
			const encoded = Buffer.from(':secret').toString('base64');

			try {
				service.resolveClientId({
					client_id: 'body-client',
					authorization_header: `Basic ${encoded}`,
				});

				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('throws when no client_id available from any source', () => {
			try {
				service.resolveClientId({});
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});
	});

	describe('authenticateClient', () => {
		let service: McpOAuthService;

		const secret = 'test-secret-value-long-enough-for-testing';
		const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

		function basicHeader(user: string, pass: string): string {
			return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
		}

		beforeEach(() => {
			service = new McpOAuthService({ knex: db, schema });
		});

		// --- none method ---

		it('none: passes with no credentials', () => {
			const client = { token_endpoint_auth_method: 'none' };
			expect(() => service.authenticateClient(client, {})).not.toThrow();
		});

		it('none: rejects Basic header', () => {
			const client = { token_endpoint_auth_method: 'none' };

			try {
				service.authenticateClient(client, { authorization_header: basicHeader('id', 'secret') });
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('none: rejects client_secret in body', () => {
			const client = { token_endpoint_auth_method: 'none' };

			try {
				service.authenticateClient(client, { client_secret: 'some-secret' });
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		// --- Symmetric confidential client tests ---

		describe.each(confidentialMethods)('$label', ({ method, makeAuthParams }) => {
			it('valid secret passes', () => {
				const client = { token_endpoint_auth_method: method, client_secret_hash: secretHash };
				const params = makeAuthParams('my-client', secret);
				expect(() => service.authenticateClient(client, params)).not.toThrow();
			});

			it('wrong secret rejects with 401', () => {
				const client = { token_endpoint_auth_method: method, client_secret_hash: secretHash };
				const params = makeAuthParams('my-client', 'wrong-secret');

				try {
					service.authenticateClient(client, params);
					expect.unreachable('should have thrown');
				} catch (err) {
					expect(err).toBeInstanceOf(OAuthError);
					expect((err as OAuthError).status).toBe(401);
					expect((err as OAuthError).code).toBe('invalid_client');
				}
			});
		});

		// --- Asymmetric method-specific tests ---

		it('client_secret_basic: missing header rejects with 401 + WWW-Authenticate', () => {
			const client = { token_endpoint_auth_method: 'client_secret_basic', client_secret_hash: secretHash };

			try {
				service.authenticateClient(client, {});
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(401);
				expect((err as OAuthError).code).toBe('invalid_client');
				expect((err as OAuthError).headers).toEqual({ 'WWW-Authenticate': 'Basic realm="directus"' });
			}
		});

		it('client_secret_basic: rejects client_secret in body', () => {
			const client = { token_endpoint_auth_method: 'client_secret_basic', client_secret_hash: secretHash };
			const params = { authorization_header: basicHeader('my-client', secret), client_secret: secret };

			try {
				service.authenticateClient(client, params);
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('client_secret_basic: rejects body-only secret without header', () => {
			const client = { token_endpoint_auth_method: 'client_secret_basic', client_secret_hash: secretHash };

			try {
				service.authenticateClient(client, { client_secret: secret });
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		it('client_secret_post: missing secret rejects', () => {
			const client = { token_endpoint_auth_method: 'client_secret_post', client_secret_hash: secretHash };

			try {
				service.authenticateClient(client, {});
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(401);
				expect((err as OAuthError).code).toBe('invalid_client');
			}
		});

		it('client_secret_post: rejects Basic header', () => {
			const client = { token_endpoint_auth_method: 'client_secret_post', client_secret_hash: secretHash };
			const params = { authorization_header: basicHeader('my-client', secret) };

			try {
				service.authenticateClient(client, params);
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(400);
				expect((err as OAuthError).code).toBe('invalid_request');
			}
		});

		// --- Edge cases ---

		it('rejects when stored hash is corrupt (length mismatch)', () => {
			const client = { token_endpoint_auth_method: 'client_secret_post', client_secret_hash: 'short' };
			const params = { client_secret: secret };

			try {
				service.authenticateClient(client, params);
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(401);
				expect((err as OAuthError).code).toBe('invalid_client');
			}
		});

		it('rejects when stored hash is null for confidential client', () => {
			const client = { token_endpoint_auth_method: 'client_secret_post', client_secret_hash: null };
			const params = { client_secret: secret };

			try {
				service.authenticateClient(client, params);
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(401);
				expect((err as OAuthError).code).toBe('invalid_client');
			}
		});

		it('rejects unknown auth method stored in DB', () => {
			const client = { token_endpoint_auth_method: 'private_key_jwt' };

			try {
				service.authenticateClient(client, {});
				expect.unreachable('should have thrown');
			} catch (err) {
				expect(err).toBeInstanceOf(OAuthError);
				expect((err as OAuthError).status).toBe(401);
				expect((err as OAuthError).code).toBe('invalid_client');
			}
		});
	});
});
