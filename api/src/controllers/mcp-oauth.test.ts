import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { SchemaOverview } from '@directus/types';
import express, { type Router } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';
import { expectMcpBearerChallenge } from '../test-utils/mcp-oauth.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

vi.mock('../database/index.js', () => ({
	default: vi.fn(() => vi.fn().mockReturnValue(mockDbChain)),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../services/mcp-oauth/index.js', () => {
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

	class OAuthError extends Error {
		constructor(
			public status: number,
			public code: string,
			public description: string,
			public redirectable: boolean = false,
		) {
			super(description);
			this.name = 'OAuthError';
		}
	}

	return { McpOAuthService, OAuthError };
});

vi.mock('../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: mockSettingsReadSingleton,
	})),
}));

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({
		collections: {},
		relations: [],
	} as unknown as SchemaOverview),
}));

vi.mock('../rate-limiter.js', () => ({
	createRateLimiter: vi.fn().mockReturnValue({
		consume: vi.fn().mockResolvedValue({}),
	}),
	RateLimiterRes: class RateLimiterRes {
		msBeforeNext = 1000;
	},
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		PUBLIC_URL: 'http://localhost',
		SESSION_COOKIE_NAME: 'directus_session',
		RATE_LIMITER_MCP_OAUTH_ENABLED: true,
	}),
}));

vi.mock('../utils/get-accountability-for-token.js', () => ({
	getAccountabilityForToken: vi.fn().mockResolvedValue({
		user: 'test-user-id',
		role: 'test-role',
		admin: false,
	}),
}));

vi.mock('./mcp-oauth-consent-page.js', () => ({
	renderConsentPage: vi.fn().mockResolvedValue('<html>consent</html>'),
	renderErrorPage: vi.fn().mockResolvedValue('<html>error</html>'),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
const { mcpOAuthPublicRouter, mcpOAuthProtectedRouter } = await import('./mcp-oauth.js');

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

async function postForm(router: Router, path: string, body: Record<string, string> | string) {
	return requestRouter(router, path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
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
		});

		test('disabled authorize endpoint renders local HTML error page', async () => {
			mockSettingsReadSingleton.mockResolvedValueOnce({
				mcp_enabled: true,
				mcp_oauth_enabled: false,
			});

			const res = await requestRouter(
				mcpOAuthPublicRouter,
				'/mcp-oauth/authorize?client_id=test-client&redirect_uri=http://localhost/callback',
			);

			expect(res.status).toBe(403);
			expect(res.headers.get('content-type')).toContain('text/html');
			expect(res.text).toBe('<html>error</html>');
		});
	});

	// -----------------------------------------------------------------------
	// Cross-cutting: CORS wildcard on all public endpoints
	// -----------------------------------------------------------------------

	test.each([
		['GET', '/.well-known/oauth-protected-resource*', 0],
		['POST', '/mcp-oauth/register', 2],
		['POST', '/mcp-oauth/token', 3],
		['POST', '/mcp-oauth/revoke', 2],
	])('setCorsWildcard sets Access-Control-Allow-Origin: * on %s %s', async (method, path, corsIndex) => {
		const handlers = getRouteHandler(mcpOAuthPublicRouter, method, path);
		const req = createMockRequest({ method: method as any, body: {}, ip: '127.0.0.1' });
		const res = createMockResponse();
		const next = vi.fn();

		await handlers[corsIndex]!.handle(req, res, next);

		expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
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

			// Run handlers starting from index 1 (rate limiter), 2 (cors), 3 (handler)
			for (let i = 1; i < handlers.length; i++) {
				await handlers[i]!.handle(req, res, next);
			}

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'test-id' }));
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

			// requireCookieAuth is index 2
			await handlers[2]!.handle(req, res, next);

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

			// requireSameOrigin is index 3
			await handlers[3]!.handle(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
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

		test('OAuth accountability redirects to login before consent validation', async () => {
			const { getAccountabilityForToken } = await import('../utils/get-accountability-for-token.js');
			const { McpOAuthService } = await import('../services/mcp-oauth/index.js');

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
			const { McpOAuthService, OAuthError } = await import('../services/mcp-oauth/index.js');

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
			const { McpOAuthService, OAuthError } = await import('../services/mcp-oauth/index.js');

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
			const { McpOAuthService, OAuthError } = await import('../services/mcp-oauth/index.js');

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
		const { errorHandler } = await import('../middleware/error-handler.js');

		const { InvalidCredentialsError } = await import('@directus/errors');

		const error = new InvalidCredentialsError();
		const req = createMockRequest({ path: '/mcp/messages' } as any);
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

		const { errorHandler } = await import('../middleware/error-handler.js');
		const { InvalidCredentialsError } = await import('@directus/errors');

		const error = new InvalidCredentialsError();
		const req = createMockRequest({ path: '/mcp/messages' } as any);
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
	let getRedirectIndicator: typeof import('./mcp-oauth.js').getRedirectIndicator;

	beforeEach(async () => {
		({ getRedirectIndicator } = await import('./mcp-oauth.js'));
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
