import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { SchemaOverview } from '@directus/types';
import express, { type Router } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { OAuthError } from '../../services/mcp-oauth/types/error.js';
import { isLoopbackHost } from '../../services/mcp-oauth/utils/loopback.js';
import { createMockRequest, createMockResponse, getRouteHandler } from '../../test-utils/controllers.js';
import { expectMcpBearerChallenge } from '../../test-utils/mcp-oauth.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const createdRateLimiters = vi.hoisted(() => [] as string[]);

const mockLogger = vi.hoisted(() => ({
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}));

const mockDbChain = {
	select: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	first: vi.fn().mockResolvedValue({ mcp_enabled: true }),
};

const mockSettingsReadSingleton = vi.fn().mockResolvedValue({
	mcp_enabled: true,
	mcp_oauth_enabled: true,
	project_name: 'Directus',
	project_color: '#6644ff',
	project_logo: null,
	default_appearance: 'auto',
});

vi.mock('../../database/index.js', () => ({
	default: vi.fn(() => vi.fn().mockReturnValue(mockDbChain)),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../../services/mcp-oauth/index.js', () => {
	const McpOAuthService = vi.fn();

	McpOAuthService.prototype.getProtectedResourceMetadata = vi
		.fn()
		.mockReturnValue({ resource: 'http://localhost/mcp' });

	McpOAuthService.prototype.getAuthorizationServerMetadata = vi.fn().mockReturnValue({
		issuer: 'http://localhost',
		token_endpoint: 'http://localhost/mcp/token',
	});

	McpOAuthService.prototype.registerClient = vi.fn().mockResolvedValue({
		client_id: 'test-id',
		client_name: 'Test',
		redirect_uris: ['http://localhost/callback'],
		grant_types: ['authorization_code'],
		response_types: ['code'],
		token_endpoint_auth_method: 'none',
		client_id_issued_at: 1000,
	});

	McpOAuthService.prototype.exchangeCode = vi.fn().mockResolvedValue({
		access_token: 'at',
		token_type: 'Bearer',
		expires_in: 3600,
		scope: 'mcp:access',
	});

	McpOAuthService.prototype.refreshToken = vi.fn().mockResolvedValue({
		access_token: 'at2',
		token_type: 'Bearer',
		expires_in: 3600,
		refresh_token: 'rt2',
		scope: 'mcp:access',
	});

	McpOAuthService.prototype.revokeToken = vi.fn().mockResolvedValue(undefined);

	McpOAuthService.prototype.validateAuthorization = vi.fn().mockResolvedValue({
		signed_params: 'jwt',
		client_name: 'Test',
		already_consented: false,
	});

	McpOAuthService.prototype.processDecision = vi
		.fn()
		.mockResolvedValue('http://localhost/callback?code=abc&iss=http://localhost');

	return { McpOAuthService, OAuthError, isLoopbackHost };
});

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: mockSettingsReadSingleton,
	})),
}));

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({
		collections: {},
		relations: [],
	} as unknown as SchemaOverview),
}));

vi.mock('../../rate-limiter.js', () => ({
	createRateLimiter: vi.fn().mockImplementation((prefix: string) => {
		createdRateLimiters.push(prefix);

		return {
			consume: vi.fn().mockResolvedValue({}),
		};
	}),
	RateLimiterRes: class RateLimiterRes {
		msBeforeNext = 1000;
	},
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: () => mockLogger,
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		PUBLIC_URL: 'http://localhost',
		SESSION_COOKIE_NAME: 'directus_session',
		RATE_LIMITER_MCP_OAUTH_ENABLED: true,
		RATE_LIMITER_MCP_OAUTH_REGISTRATION_ENABLED: true,
	}),
}));

vi.mock('../../utils/get-accountability-for-token.js', () => ({
	getAccountabilityForToken: vi.fn().mockResolvedValue({
		user: 'test-user-id',
		role: 'test-role',
		admin: false,
	}),
}));

vi.mock('./oauth-consent-page.js', () => ({
	renderConsentPage: vi.fn().mockResolvedValue('<html>consent</html>'),
	renderErrorPage: vi.fn().mockResolvedValue('<html>error</html>'),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
const { useEnv } = await import('@directus/env');
const { mcpOAuthPublicRouter, mcpOAuthProtectedRouter } = await import('./oauth.js');
const { renderErrorPage } = await import('./oauth-consent-page.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate a redirect mock on response */
function createRedirectResponse() {
	const res = createMockResponse();
	(res as any).redirect = vi.fn();
	return res;
}

function createAppForRouter(router: Router) {
	const app = express();
	app.use(router);
	return app;
}

async function requestRouter(
	router: Router,
	path: string,
	options: { method?: string; body?: Record<string, string> | string; headers?: Record<string, string> } = {},
) {
	const server = http.createServer(createAppForRouter(router));

	await new Promise<void>((resolve, reject) => {
		server.on('error', reject);
		server.listen(0, resolve);
	});

	const { port } = server.address() as AddressInfo;
	let encodedBody: string | undefined;

	if (typeof options.body === 'string') {
		encodedBody = options.body;
	} else if (options.body) {
		encodedBody = new URLSearchParams(options.body).toString();
	}

	try {
		const response = await fetch(`http://127.0.0.1:${port}${path}`, {
			method: options.method ?? 'GET',
			headers: {
				'User-Agent': 'test',
				...options.headers,
			},
			body: encodedBody,
		});

		const text = await response.text();
		let body;

		try {
			body = text ? JSON.parse(text) : undefined;
		} catch {
			body = undefined;
		}

		return {
			body,
			headers: response.headers,
			status: response.status,
			text,
		};
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
	}
}

async function postForm(
	router: Router,
	path: string,
	body: Record<string, string> | string,
	options: { headers?: Record<string, string> } = {},
) {
	return requestRouter(router, path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			...options.headers,
		},
		body,
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mcp-oauth controller', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'http://localhost',
			SESSION_COOKIE_NAME: 'directus_session',
			RATE_LIMITER_MCP_OAUTH_ENABLED: true,
			RATE_LIMITER_MCP_OAUTH_REGISTRATION_ENABLED: true,
			MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: ['raycast://oauth', 'cursor://cursor.mcp', 'cursor://anysphere.cursor-mcp'],
		} as any);

		mockSettingsReadSingleton.mockResolvedValue({
			mcp_enabled: true,
			mcp_oauth_enabled: true,
			project_name: 'Directus',
			project_color: '#6644ff',
			project_logo: null,
			default_appearance: 'auto',
		});
	});

	describe('settings gate', () => {
		test('disabled token endpoint response includes CORS and no-store headers', async () => {
			mockSettingsReadSingleton.mockResolvedValueOnce({
				mcp_enabled: true,
				mcp_oauth_enabled: false,
			});

			const res = await postForm(mcpOAuthPublicRouter, '/mcp-oauth/token', {
				grant_type: 'authorization_code',
				client_id: 'c1',
			});

			expect(res.headers.get('access-control-allow-origin')).toBe('*');
			expect(res.headers.get('cache-control')).toBe('no-store');
			expect(res.headers.get('pragma')).toBe('no-cache');
			expect(res.status).toBe(403);
			expect(res.body).toMatchObject({ error: 'mcp_oauth_disabled' });
			expect(mockSettingsReadSingleton).toHaveBeenCalledTimes(1);
			expect(mockSettingsReadSingleton).toHaveBeenCalledWith({ fields: ['mcp_enabled', 'mcp_oauth_enabled'] });
		});

		test('disabled discovery endpoint with authorize path segment returns JSON error', async () => {
			mockSettingsReadSingleton.mockResolvedValueOnce({
				mcp_enabled: true,
				mcp_oauth_enabled: false,
			});

			const res = await requestRouter(mcpOAuthPublicRouter, '/.well-known/oauth-protected-resource/authorize');

			expect(res.status).toBe(403);
			expect(res.headers.get('access-control-allow-origin')).toBe('*');
			expect(res.body).toMatchObject({ error: 'mcp_oauth_disabled' });
			expect(renderErrorPage).not.toHaveBeenCalled();
			expect(mockSettingsReadSingleton).toHaveBeenCalledTimes(1);
			expect(mockSettingsReadSingleton).toHaveBeenCalledWith({ fields: ['mcp_enabled', 'mcp_oauth_enabled'] });
		});

		test('disabled authorize endpoint renders local HTML error page', async () => {
			mockSettingsReadSingleton
				.mockResolvedValueOnce({
					mcp_enabled: true,
					mcp_oauth_enabled: false,
				})
				.mockResolvedValueOnce({
					project_name: 'Branded Project',
					project_color: '#123456',
					project_logo: 'logo-id',
					default_appearance: 'light',
				});

			const res = await requestRouter(
				mcpOAuthPublicRouter,
				'/mcp-oauth/authorize?client_id=test-client&redirect_uri=http://localhost/callback',
			);

			expect(res.status).toBe(403);
			expect(res.headers.get('content-type')).toContain('text/html');
			expect(res.text).toBe('<html>error</html>');

			expect(renderErrorPage).toHaveBeenCalledWith('MCP OAuth is disabled in project settings.', {
				projectName: 'Branded Project',
				projectColor: '#123456',
				logoUrl: 'http://localhost/assets/logo-id',
				appearance: 'light',
			});
		});
	});

	// -----------------------------------------------------------------------
	// Cross-cutting: CORS wildcard on all public endpoints
	// -----------------------------------------------------------------------

	test.each([
		['GET', '/.well-known/oauth-protected-resource*', 0],
		['POST', '/mcp-oauth/register', 4],
		['POST', '/mcp-oauth/token', 4],
		['POST', '/mcp-oauth/revoke', 4],
	])('setCorsWildcard sets Access-Control-Allow-Origin: * on %s %s', async (method, path, corsIndex) => {
		const handlers = getRouteHandler(mcpOAuthPublicRouter, method, path);
		const req = createMockRequest({ method: method as any, body: {}, ip: '127.0.0.1' });
		const res = createMockResponse();
		const next = vi.fn();

		await handlers[corsIndex]!.handle(req, res, next);

		expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
	});

	test('dedicated MCP OAuth limiters use shared runtime pool plus registration pool', () => {
		expect(createdRateLimiters).toContain('RATE_LIMITER_MCP_OAUTH');
		expect(createdRateLimiters).toContain('RATE_LIMITER_MCP_OAUTH_REGISTRATION');
		expect(createdRateLimiters).not.toContain('RATE_LIMITER_MCP_OAUTH_AUTHORIZE');

		expect(getRouteHandler(mcpOAuthPublicRouter, 'GET', '/mcp-oauth/authorize')).toHaveLength(3);
		expect(getRouteHandler(mcpOAuthPublicRouter, 'POST', '/mcp-oauth/register')).toHaveLength(6);
		expect(getRouteHandler(mcpOAuthPublicRouter, 'POST', '/mcp-oauth/token')).toHaveLength(7);
		expect(getRouteHandler(mcpOAuthPublicRouter, 'POST', '/mcp-oauth/revoke')).toHaveLength(6);
	});

	// -----------------------------------------------------------------------
	// Discovery endpoints
	// -----------------------------------------------------------------------

	describe('discovery endpoints', () => {
		test('GET /.well-known/oauth-protected-resource returns JSON without authentication', async () => {
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/.well-known/oauth-protected-resource*');
			const req = createMockRequest();
			const res = createMockResponse();
			const next = vi.fn();

			// Run through all handlers in order (setCorsWildcard, then asyncHandler)
			for (const handler of handlers) {
				await handler.handle(req, res, next);
			}

			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ resource: 'http://localhost/mcp' }));
			expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
		});

		test('GET /.well-known/oauth-authorization-server returns JSON without authentication', async () => {
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/.well-known/oauth-authorization-server*');
			const req = createMockRequest();
			const res = createMockResponse();
			const next = vi.fn();

			for (const handler of handlers) {
				await handler.handle(req, res, next);
			}

			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ issuer: 'http://localhost' }));
			expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
		});

		test('public discovery router ignores invalid Authorization header', async () => {
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/.well-known/oauth-protected-resource*');
			const req = createMockRequest({ headers: { authorization: 'Bearer invalid-garbage' } });
			const res = createMockResponse();
			const next = vi.fn();

			for (const handler of handlers) {
				await handler.handle(req, res, next);
			}

			// Should still succeed -- no auth required on discovery
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ resource: 'http://localhost/mcp' }));
		});
	});

	// -----------------------------------------------------------------------
	// Register endpoint
	// -----------------------------------------------------------------------

	describe('POST /mcp-oauth/register', () => {
		test('accepts JSON, returns RFC 7591 format', async () => {
			// Skip express.json() middleware (index 0) in test -- body already parsed
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'POST', '/mcp-oauth/register');

			const req = createMockRequest({
				method: 'POST',
				body: {
					client_name: 'Test',
					redirect_uris: ['http://localhost/callback'],
					grant_types: ['authorization_code'],
				},
				ip: '127.0.0.1',
			});

			const res = createMockResponse();
			const next = vi.fn();

			// Skip express.json() and the parse-error middleware; the body is already parsed in this unit test.
			for (const index of [1, 4, 5]) await handlers[index]!.handle(req, res, next);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'test-id' }));
		});

		test('logs non-sensitive debug context when registration is rejected', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(McpOAuthService.prototype.registerClient).mockRejectedValueOnce(
				new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must use HTTPS (except for localhost)'),
			);

			const res = await requestRouter(mcpOAuthPublicRouter, '/mcp-oauth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					client_name: 'Raycast MCP',
					redirect_uris: ['raycast://callback?code=secret'],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
					client_secret: 'secret-value',
				}),
			});

			expect(res.status).toBe(400);
			expect(res.body).toMatchObject({ error: 'invalid_redirect_uri' });

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'invalid_redirect_uri',
					description: 'redirect_uri must use HTTPS (except for localhost)',
					registration: expect.objectContaining({
						client_secret_present: true,
						client_name: expect.objectContaining({ length: 11 }),
						redirect_uris: expect.objectContaining({
							uris: [expect.objectContaining({ scheme: 'raycast', hostname: 'callback', has_query: true })],
						}),
					}),
				}),
				'MCP OAuth DCR request rejected',
			);

			const debugCalls = JSON.stringify(mockLogger.debug.mock.calls);
			expect(debugCalls).not.toContain('secret-value');
			expect(debugCalls).not.toContain('code=secret');
			expect(debugCalls).not.toContain('Raycast MCP');
		});
	});

	// -----------------------------------------------------------------------
	// Token endpoint
	// -----------------------------------------------------------------------

	describe('POST /mcp-oauth/token', () => {
		test('accepts urlencoded, returns RFC 6749 format', async () => {
			const res = await postForm(mcpOAuthPublicRouter, '/mcp-oauth/token', {
				grant_type: 'authorization_code',
				client_id: 'c1',
				code: 'x',
				redirect_uri: 'http://l',
				code_verifier: 'v'.repeat(43),
			});

			expect(res.status).toBe(200);
			expect(res.body).toMatchObject({ access_token: 'at', token_type: 'Bearer' });
		});

		test('forwards Basic Authorization header to authorization_code exchange', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');
			const authorization = `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`;

			await postForm(
				mcpOAuthPublicRouter,
				'/mcp-oauth/token',
				{
					grant_type: 'authorization_code',
					client_id: 'client-id',
					code: 'x',
					redirect_uri: 'http://l',
					code_verifier: 'v'.repeat(43),
				},
				{ headers: { Authorization: authorization } },
			);

			expect(McpOAuthService.prototype.exchangeCode).toHaveBeenCalledWith(
				expect.objectContaining({ authorization_header: authorization }),
				expect.any(Object),
			);
		});

		test('forwards Basic Authorization header to refresh_token exchange', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');
			const authorization = `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`;

			await postForm(
				mcpOAuthPublicRouter,
				'/mcp-oauth/token',
				{
					grant_type: 'refresh_token',
					client_id: 'client-id',
					refresh_token: 'refresh-token',
				},
				{ headers: { Authorization: authorization } },
			);

			expect(McpOAuthService.prototype.refreshToken).toHaveBeenCalledWith(
				expect.objectContaining({ authorization_header: authorization }),
				expect.any(Object),
			);
		});

		test('serializes OAuthError response headers', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(McpOAuthService.prototype.exchangeCode).mockRejectedValueOnce(
				new OAuthError(401, 'invalid_client', 'Invalid client authentication', false, {
					'WWW-Authenticate': 'Basic realm="mcp-oauth"',
				}),
			);

			const res = await postForm(mcpOAuthPublicRouter, '/mcp-oauth/token', {
				grant_type: 'authorization_code',
				client_id: 'client-id',
				code: 'x',
				redirect_uri: 'http://l',
				code_verifier: 'v'.repeat(43),
			});

			expect(res.status).toBe(401);
			expect(res.headers.get('www-authenticate')).toBe('Basic realm="mcp-oauth"');
			expect(res.body).toMatchObject({ error: 'invalid_client' });
		});

		test('duplicate form params on /mcp-oauth/token rejected as invalid_request', async () => {
			const res = await postForm(
				mcpOAuthPublicRouter,
				'/mcp-oauth/token',
				'grant_type=authorization_code&grant_type=refresh_token&client_id=c1',
			);

			expect(res.status).toBe(400);

			expect(res.body).toMatchObject({
				error: 'invalid_request',
				error_description: expect.stringContaining('Duplicate parameter'),
			});
		});

		test.each([
			['missing grant_type', 'invalid_request', { client_id: 'c1' }],
			['empty grant_type', 'invalid_request', { grant_type: '', client_id: 'c1' }],
			['unsupported grant_type', 'unsupported_grant_type', { grant_type: 'client_credentials', client_id: 'c1' }],
		])('%s returns %s', async (_name, error, body) => {
			const res = await postForm(mcpOAuthPublicRouter, '/mcp-oauth/token', body);

			expect(res.status).toBe(400);
			expect(res.body).toMatchObject({ error });
		});
	});

	// -----------------------------------------------------------------------
	// Revoke endpoint
	// -----------------------------------------------------------------------

	describe('POST /mcp-oauth/revoke', () => {
		test('duplicate form params on /mcp-oauth/revoke rejected as invalid_request', async () => {
			const res = await postForm(mcpOAuthPublicRouter, '/mcp-oauth/revoke', 'token=a&token=b');

			expect(res.status).toBe(400);
			expect(res.body).toMatchObject({ error: 'invalid_request' });
		});

		test('forwards Basic Authorization header to token revocation', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');
			const authorization = `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`;

			await postForm(
				mcpOAuthPublicRouter,
				'/mcp-oauth/revoke',
				{
					token: 'access-token',
					client_id: 'client-id',
				},
				{ headers: { Authorization: authorization } },
			);

			expect(McpOAuthService.prototype.revokeToken).toHaveBeenCalledWith(
				expect.objectContaining({ authorization_header: authorization }),
			);
		});
	});

	// -----------------------------------------------------------------------
	// Decision endpoint (protected)
	// -----------------------------------------------------------------------

	describe('POST /mcp-oauth/authorize/decision', () => {
		test('duplicate form params on decision endpoint rejected', async () => {
			const res = await postForm(mcpOAuthProtectedRouter, '/mcp-oauth/authorize/decision', 'approved=yes&approved=no');

			expect(res.status).toBe(400);

			expect(res.body).toMatchObject({
				error: 'invalid_request',
				error_description: expect.stringContaining('Duplicate parameter'),
			});
		});

		test('rejects non-cookie tokens', async () => {
			const handlers = getRouteHandler(mcpOAuthProtectedRouter, 'POST', '/mcp-oauth/authorize/decision');

			const req = createMockRequest({
				method: 'POST',
				tokenSource: 'header',
				token: 'some-token',
			} as any);

			const res = createMockResponse();
			const next = vi.fn();

			// requireCookieAuth is index 3
			await handlers[3]!.handle(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'access_denied' }));
		});

		test('rejects cross-origin requests', async () => {
			const handlers = getRouteHandler(mcpOAuthProtectedRouter, 'POST', '/mcp-oauth/authorize/decision');

			const req = createMockRequest({
				method: 'POST',
				tokenSource: 'cookie',
				token: 'session-token',
				headers: { origin: 'http://evil.com' },
			} as any);

			const res = createMockResponse();
			const next = vi.fn();

			// requireSameOrigin is index 4
			await handlers[4]!.handle(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
		});

		test('rejects consent decisions when MCP OAuth is disabled in settings', async () => {
			mockSettingsReadSingleton.mockResolvedValueOnce({
				mcp_enabled: true,
				mcp_oauth_enabled: false,
			});

			const handlers = getRouteHandler(mcpOAuthProtectedRouter, 'POST', '/mcp-oauth/authorize/decision');

			const req = createMockRequest({
				method: 'POST',
				path: '/mcp-oauth/authorize/decision',
				tokenSource: 'cookie',
				token: 'session-token',
				accountability: { user: 'test-user-id' },
			} as any);

			const res = createMockResponse();
			const next = vi.fn();

			await handlers[0]!.handle(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.send).toHaveBeenCalledWith('<html>error</html>');
			expect(next).not.toHaveBeenCalled();
		});
	});

	// -----------------------------------------------------------------------
	// Authorize GET - front-channel error split
	// -----------------------------------------------------------------------

	describe('GET /mcp-oauth/authorize error handling', () => {
		function createAuthorizeRequest(query: Record<string, string> = {}) {
			return createMockRequest({
				method: 'GET',
				query: {
					client_id: 'test-client',
					redirect_uri: 'http://localhost/callback',
					response_type: 'code',
					code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
					code_challenge_method: 'S256',
					scope: 'mcp:access',
					resource: 'http://localhost/mcp',
					...query,
				},
				cookies: { directus_session: 'valid-session-token' },
				originalUrl: '/mcp-oauth/authorize?client_id=test-client',
			} as any);
		}

		async function runAuthorizeRequest(query: Record<string, string> = {}) {
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/mcp-oauth/authorize');
			const req = createAuthorizeRequest(query);
			const res = createRedirectResponse();
			const next = vi.fn();

			const lastHandler = handlers[handlers.length - 1]!;
			await lastHandler.handle(req, res, next);

			return { req, res, next };
		}

		test('consent page CSP allows known MCP desktop redirect schemes in form redirect chain', async () => {
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');
			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/mcp-oauth/authorize');
			const req = createAuthorizeRequest({ redirect_uri: 'raycast://oauth?package_name=directus' });

			const res = createRedirectResponse();

			(res as any).getHeader = vi
				.fn()
				.mockReturnValue("default-src 'self'; form-action 'self'; frame-ancestors 'self'");

			vi.mocked(McpOAuthService.prototype.validateAuthorization).mockResolvedValueOnce({
				signed_params: 'jwt',
				client_name: 'Raycast',
				redirect_uri: 'raycast://oauth?package_name=directus',
				scope: 'mcp:access',
				registration_type: 'dcr',
			});

			const next = vi.fn();
			const lastHandler = handlers[handlers.length - 1]!;
			await lastHandler.handle(req, res, next);

			expect(res.set).toHaveBeenCalledWith(
				'Content-Security-Policy',
				expect.stringContaining("form-action 'self' https: http://localhost:* http://127.0.0.1:* raycast: cursor:"),
			);
		});

		test('consent page CSP derives custom redirect schemes from env', async () => {
			const { useEnv } = vi.mocked(await import('@directus/env'));
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');

			useEnv.mockReturnValue({
				PUBLIC_URL: 'http://localhost',
				SESSION_COOKIE_NAME: 'directus_session',
				RATE_LIMITER_MCP_OAUTH_ENABLED: true,
				RATE_LIMITER_MCP_OAUTH_REGISTRATION_ENABLED: true,
				MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: ['myapp://oauth'],
			} as any);

			vi.mocked(McpOAuthService.prototype.validateAuthorization).mockResolvedValueOnce({
				signed_params: 'jwt',
				client_name: 'Custom App',
				redirect_uri: 'myapp://oauth/callback',
				scope: 'mcp:access',
				registration_type: 'dcr',
			});

			const handlers = getRouteHandler(mcpOAuthPublicRouter, 'GET', '/mcp-oauth/authorize');
			const req = createAuthorizeRequest({ redirect_uri: 'myapp://oauth/callback' });
			const res = createRedirectResponse();

			(res as any).getHeader = vi
				.fn()
				.mockReturnValue("default-src 'self'; form-action 'self'; frame-ancestors 'self'");

			const next = vi.fn();
			const lastHandler = handlers[handlers.length - 1]!;
			await lastHandler.handle(req, res, next);

			expect(res.set).toHaveBeenCalledWith(
				'Content-Security-Policy',
				expect.stringContaining("form-action 'self' https: http://localhost:* http://127.0.0.1:* myapp:"),
			);

			const csp = vi.mocked(res.set).mock.calls.find(([header]) => header === 'Content-Security-Policy')?.[1];
			expect(csp).not.toContain('raycast:');
			expect(csp).not.toContain('cursor:');
		});

		test('OAuth accountability redirects to login before consent validation', async () => {
			const { getAccountabilityForToken } = await import('../../utils/get-accountability-for-token.js');
			const { McpOAuthService } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(getAccountabilityForToken).mockResolvedValueOnce({
				user: 'test-user-id',
				role: 'test-role',
				roles: [],
				admin: false,
				app: false,
				ip: null,
				oauth: {
					client: 'client-id',
					scopes: ['mcp:access'],
					aud: ['http://localhost/mcp'],
				},
			});

			const { res, next } = await runAuthorizeRequest();

			expect(res.redirect).toHaveBeenCalledWith(
				302,
				'http://localhost/admin/login?redirect=%2Fmcp-oauth%2Fauthorize%3Fclient_id%3Dtest-client',
			);

			expect(McpOAuthService.prototype.validateAuthorization).not.toHaveBeenCalled();
			expect(res.send).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});

		test('pre-trust error (invalid client_id) renders local error page', async () => {
			const { McpOAuthService, OAuthError } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(McpOAuthService.prototype.validateAuthorization).mockRejectedValueOnce(
				new OAuthError(400, 'invalid_request', 'Unknown client_id'),
			);

			const { res } = await runAuthorizeRequest();

			// Should render local error page, NOT redirect
			expect(res.redirect).not.toHaveBeenCalled();
			expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
			expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalled();
		});

		test('post-trust error redirects to redirect_uri with error params', async () => {
			const { McpOAuthService, OAuthError } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(McpOAuthService.prototype.validateAuthorization).mockRejectedValueOnce(
				new OAuthError(400, 'invalid_scope', 'Only scope mcp:access is supported', true),
			);

			const { res } = await runAuthorizeRequest({ state: 'abc' });

			// Should redirect, NOT render local error page
			expect(res.send).not.toHaveBeenCalled();
			expect(res.redirect).toHaveBeenCalledWith(302, expect.any(String));

			const redirectUrl = new URL((res.redirect as any).mock.calls[0][1]);
			expect(redirectUrl.origin).toBe('http://localhost');
			expect(redirectUrl.pathname).toBe('/callback');
			expect(redirectUrl.searchParams.get('error')).toBe('invalid_scope');
			expect(redirectUrl.searchParams.get('error_description')).toBe('Only scope mcp:access is supported');
			expect(redirectUrl.searchParams.get('state')).toBe('abc');
			expect(redirectUrl.searchParams.get('iss')).toBe('http://localhost');
		});

		test('post-trust error without state omits state param', async () => {
			const { McpOAuthService, OAuthError } = await import('../../services/mcp-oauth/index.js');

			vi.mocked(McpOAuthService.prototype.validateAuthorization).mockRejectedValueOnce(
				new OAuthError(400, 'invalid_request', 'code_challenge is required', true),
			);

			const { res } = await runAuthorizeRequest();

			expect(res.redirect).toHaveBeenCalledWith(302, expect.any(String));

			const redirectUrl = new URL((res.redirect as any).mock.calls[0][1]);
			expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
			expect(redirectUrl.searchParams.get('error_description')).toBe('code_challenge is required');
			expect(redirectUrl.searchParams.has('state')).toBe(false);
			expect(redirectUrl.searchParams.get('iss')).toBe('http://localhost');
		});
	});
});

// ---------------------------------------------------------------------------
// Error handler tests
// ---------------------------------------------------------------------------

describe('error-handler MCP 401', () => {
	test('MCP 401 exposes WWW-Authenticate via Access-Control-Expose-Headers', async () => {
		// We need to test the error handler directly
		const { useEnv } = await import('@directus/env');

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'http://localhost',
			MCP_OAUTH_ENABLED: true,
		} as any);

		// Import the real error handler
		const { errorHandler } = await import('../../middleware/error-handler.js');

		const { InvalidCredentialsError } = await import('@directus/errors');

		const error = new InvalidCredentialsError();
		const req = createMockRequest({ path: '/mcp' } as any);
		const res = createMockResponse();
		const next = vi.fn();

		await (errorHandler as any)(error, req, res, next);

		expectMcpBearerChallenge(res, { status: 401, resourceMetadata: true });
	});

	test('resource_metadata URL in WWW-Authenticate matches exact RFC 9728 path-inserted URL', async () => {
		const { useEnv } = await import('@directus/env');

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL: 'http://localhost/directus',
			MCP_OAUTH_ENABLED: true,
		} as any);

		const { errorHandler } = await import('../../middleware/error-handler.js');
		const { InvalidCredentialsError } = await import('@directus/errors');

		const error = new InvalidCredentialsError();
		const req = createMockRequest({ path: '/mcp' } as any);
		const res = createMockResponse();
		const next = vi.fn();

		await (errorHandler as any)(error, req, res, next);

		expect(res.set).toHaveBeenCalledWith(
			'WWW-Authenticate',
			'Bearer resource_metadata="http://localhost/directus/.well-known/oauth-protected-resource/mcp", scope="mcp:access", error="invalid_token"',
		);
	});
});

describe('getRedirectIndicator', () => {
	let getRedirectIndicator: typeof import('./oauth.js').getRedirectIndicator;

	beforeEach(async () => {
		({ getRedirectIndicator } = await import('./oauth.js'));
	});

	test('localhost redirect returns "localhost"', () => {
		expect(getRedirectIndicator('http://localhost:3000/cb', 'some-client', 'dcr')).toBe('localhost');
	});

	test('127.0.0.1 redirect returns "localhost"', () => {
		expect(getRedirectIndicator('http://127.0.0.1:3000/cb', 'some-client', 'dcr')).toBe('localhost');
	});

	test('IPv6 loopback [::1] redirect returns "localhost"', () => {
		expect(getRedirectIndicator('http://[::1]:3000/cb', 'some-client', 'dcr')).toBe('localhost');
	});

	test('bare IP redirect returns "ip-address"', () => {
		expect(getRedirectIndicator('http://192.168.1.1:3000/cb', 'some-client', 'dcr')).toBe('ip-address');
	});

	test('CIMD cross-origin redirect returns "cross-origin"', () => {
		expect(getRedirectIndicator('https://other.example.com/cb', 'https://tools.example.com/meta', 'cimd')).toBe(
			'cross-origin',
		);
	});

	test('CIMD same-origin redirect returns undefined', () => {
		expect(
			getRedirectIndicator('https://tools.example.com/cb', 'https://tools.example.com/meta', 'cimd'),
		).toBeUndefined();
	});

	test('DCR normal HTTPS redirect returns undefined', () => {
		expect(getRedirectIndicator('https://example.com/cb', 'some-uuid', 'dcr')).toBeUndefined();
	});
});
