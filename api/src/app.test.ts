import { Router } from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';

import createApp from './app';
import { ROBOTSTXT } from './constants';

vi.mock('./database', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
	isInstalled: vi.fn(),
	validateDatabaseConnection: vi.fn(),
	validateDatabaseExtensions: vi.fn(),
	validateMigrations: vi.fn(),
}));

vi.mock('./env', async () => {
	const actual = (await vi.importActual('./env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		KEY: 'xxxxxxx-xxxxxx-xxxxxxxx-xxxxxxxxxx',
		SECRET: 'abcdef',
		SERVE_APP: true,
		PUBLIC_URL: 'http://localhost:8055/directus',
		TELEMETRY: false,
		LOG_STYLE: 'raw',
	};

	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

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

vi.mock('./middleware/check-ip', () => ({
	checkIP: Router(),
}));

vi.mock('./middleware/schema', () => ({
	default: Router(),
}));

vi.mock('./middleware/get-permissions', () => ({
	default: Router(),
}));

vi.mock('./auth', () => ({
	registerAuthProviders: vi.fn(),
}));

vi.mock('./webhooks', () => ({
	init: vi.fn(),
}));

describe('createApp', async () => {
	describe('Content Security Policy', () => {
		test('Should set content-security-policy header by default', async () => {
			const app = await createApp();
			const response = await request(app).get('/');

			expect(response.headers).toHaveProperty('content-security-policy');
		});
	});

	describe('Root Redirect', () => {
		test('Should redirect root path by default', async () => {
			const app = await createApp();
			const response = await request(app).get('/');

			expect(response.status).toEqual(302);
		});
	});

	describe('robots.txt file', () => {
		test('Should respond with default robots.txt content', async () => {
			const app = await createApp();
			const response = await request(app).get('/robots.txt');

			expect(response.text).toEqual(ROBOTSTXT);
		});
	});

	describe('Admin App', () => {
		test('Should set <base /> tag href to public url with admin relative path', async () => {
			const app = await createApp();
			const response = await request(app).get('/admin');

			expect(response.text).toEqual(expect.stringContaining(`<base href="/directus/admin/" />`));
		});

		test('Should remove <embed-head /> and <embed-body /> tags when there are no custom embeds', async () => {
			mockGetEmbeds.mockReturnValueOnce({ head: '', body: '' });

			const app = await createApp();
			const response = await request(app).get('/admin');

			expect(response.text).not.toEqual(expect.stringContaining(`<embed-head />`));
			expect(response.text).not.toEqual(expect.stringContaining(`<embed-body />`));
		});

		test('Should replace <embed-head /> tag with custom embed head', async () => {
			const mockEmbedHead = '<!-- Test Embed Head -->';
			mockGetEmbeds.mockReturnValueOnce({ head: mockEmbedHead, body: '' });

			const app = await createApp();
			const response = await request(app).get('/admin');

			expect(response.text).toEqual(expect.stringContaining(mockEmbedHead));
		});

		test('Should replace <embed-body /> tag with custom embed body', async () => {
			const mockEmbedBody = '<!-- Test Embed Body -->';
			mockGetEmbeds.mockReturnValueOnce({ head: '', body: mockEmbedBody });

			const app = await createApp();
			const response = await request(app).get('/admin');

			expect(response.text).toEqual(expect.stringContaining(mockEmbedBody));
		});
	});

	describe('Server ping endpoint', () => {
		test('Should respond with pong', async () => {
			const app = await createApp();
			const response = await request(app).get('/server/ping');

			expect(response.text).toEqual('pong');
		});
	});

	describe('Custom Endpoints', () => {
		test('Should not contain route for custom endpoint', async () => {
			const testRoute = '/custom-endpoint-to-test';

			const app = await createApp();
			const response = await request(app).get(testRoute);

			expect(response.body).toEqual({
				errors: [
					{
						extensions: {
							code: 'ROUTE_NOT_FOUND',
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

			const app = await createApp();
			const response = await request(app).get(testRoute);

			expect(response.body).toEqual(testResponse);
		});
	});

	describe('Not Found Handler', () => {
		test('Should return ROUTE_NOT_FOUND error when a route does not exist', async () => {
			const testRoute = '/this-route-does-not-exist';

			const app = await createApp();
			const response = await request(app).get(testRoute);

			expect(response.body).toEqual({
				errors: [
					{
						extensions: {
							code: 'ROUTE_NOT_FOUND',
						},
						message: `Route ${testRoute} doesn't exist.`,
					},
				],
			});
		});
	});
});
