import createApp from './app.js';
import { useEnv } from '@directus/env';
import { Router } from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./database', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
	isInstalled: vi.fn(),
	validateDatabaseConnection: vi.fn(),
	validateDatabaseExtensions: vi.fn(),
	validateMigrations: vi.fn(),
}));

vi.mock('./telemetry/index.js');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EXTENSIONS_PATH: './extensions',
		STORAGE_LOCATIONS: ['local'],
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

const mockGetEndpointRouter = vi.fn().mockReturnValue(Router());
const mockGetEmbeds = vi.fn().mockReturnValue({ head: '', body: '' });

vi.mock('./extensions', () => ({
	getExtensionManager: vi.fn().mockImplementation(() => {
		return {
			initialize: vi.fn(),
			getEndpointRouter: mockGetEndpointRouter,
			getEmbeds: mockGetEmbeds,
		};
	}),
}));

vi.mock('./flows', () => ({
	getFlowManager: vi.fn().mockImplementation(() => {
		return {
			initialize: vi.fn(),
		};
	}),
}));

vi.mock('./middleware/schema', () => ({
	default: Router(),
}));

vi.mock('./auth', () => ({
	registerAuthProviders: vi.fn(),
}));

vi.mock('./utils/validate-env.js');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		SECRET: 'abcdef',
		SERVE_APP: 'true',
		PUBLIC_URL: 'http://localhost:8055/directus',
		TELEMETRY: 'false',
		LOG_STYLE: 'raw',
		EXTENSIONS_PATH: './extensions',
		STORAGE_LOCATIONS: ['local'],
		ROBOTS_TXT: 'User-agent: *\nDisallow: /',
		ROOT_REDIRECT: './admin',
		IP_TRUST_PROXY: true,
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

const request = async (path: string = '') => {
	const app = await createApp();
	const server = http.createServer(app);
	server.listen(0);
	const address = server.address() as AddressInfo;
	const baseUrl = `http://127.0.0.1:${address.port}`;

	const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });

	server.close();

	return response;
};

describe('createApp', async () => {
	describe('Content Security Policy', () => {
		test('Should set content-security-policy header by default', async () => {
			const response = await request();

			expect(response.headers.has('content-security-policy')).toBe(true);
		});
	});

	describe('Root Redirect', () => {
		test('Should redirect root path by default', async () => {
			const response = await request();

			expect(response.status).toEqual(302);
		});
	});

	describe('robots.txt file', () => {
		test('Should respond with default robots.txt content', async () => {
			const response = await request('/robots.txt');
			const body = await response.text();

			expect(body).toEqual('User-agent: *\nDisallow: /');
		});
	});

	describe('Admin App', () => {
		test('Should set <base /> tag href to public url with admin relative path', async () => {
			const response = await request('/admin');
			const body = await response.text();

			expect(body).toEqual(expect.stringContaining(`<base href="/directus/admin/" />`));
		});

		test('Should remove <embed-head /> and <embed-body /> tags when there are no custom embeds', async () => {
			mockGetEmbeds.mockReturnValueOnce({ head: '', body: '' });

			const response = await request('/admin');
			const body = await response.text();

			expect(body).not.toEqual(expect.stringContaining(`<embed-head />`));
			expect(body).not.toEqual(expect.stringContaining(`<embed-body />`));
		});

		test('Should replace <embed-head /> tag with custom embed head', async () => {
			const mockEmbedHead = '<!-- Test Embed Head -->';
			mockGetEmbeds.mockReturnValueOnce({ head: mockEmbedHead, body: '' });

			const response = await request('/admin');
			const body = await response.text();

			expect(body).toEqual(expect.stringContaining(mockEmbedHead));
		});

		test('Should replace <embed-body /> tag with custom embed body', async () => {
			const mockEmbedBody = '<!-- Test Embed Body -->';
			mockGetEmbeds.mockReturnValueOnce({ head: '', body: mockEmbedBody });

			const response = await request('/admin');
			const body = await response.text();

			expect(body).toEqual(expect.stringContaining(mockEmbedBody));
		});
	});

	describe('Server ping endpoint', () => {
		test('Should respond with pong', async () => {
			const response = await request('/server/ping');
			const body = await response.text();

			expect(body).toEqual('pong');
		});
	});

	describe('Custom Endpoints', () => {
		test('Should not contain route for custom endpoint', async () => {
			const testRoute = '/custom-endpoint-to-test';

			const response = await request(testRoute);
			const body = await response.json();

			expect(body).toEqual({
				errors: [
					{
						extensions: {
							code: 'ROUTE_NOT_FOUND',
							path: '/custom-endpoint-to-test',
						},
						message: `Route ${testRoute} doesn't exist.`,
					},
				],
			});
		});

		test('Should contain route for custom endpoint', async () => {
			const testRoute = '/custom-endpoint-to-test';
			const testResponse = { key: 'value' };
			const mockRouter = Router();

			mockRouter.use(testRoute, (_, res) => {
				res.json(testResponse);
			});

			mockGetEndpointRouter.mockReturnValueOnce(mockRouter);

			const response = await request(testRoute);
			const body = await response.json();

			expect(body).toEqual(testResponse);
		});
	});

	describe('Not Found Handler', () => {
		test('Should return ROUTE_NOT_FOUND error when a route does not exist', async () => {
			const testRoute = '/this-route-does-not-exist';

			const response = await request(testRoute);
			const body = await response.json();

			expect(body).toEqual({
				errors: [
					{
						extensions: {
							code: 'ROUTE_NOT_FOUND',
							path: '/this-route-does-not-exist',
						},
						message: `Route ${testRoute} doesn't exist.`,
					},
				],
			});
		});
	});
});
