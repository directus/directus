import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';

const readSingleton = vi.fn();
const readByQuery = vi.fn();
const itemReadByQuery = vi.fn();
const fetchAllowedFields = vi.fn();
const loggerWarn = vi.fn();
let performanceNowSpy: ReturnType<typeof vi.spyOn> | null = null;

vi.mock('../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton,
	})),
}));

vi.mock('../services/collections.js', () => ({
	CollectionsService: vi.fn().mockImplementation(() => ({
		readByQuery,
	})),
}));

vi.mock('../services/items.js', () => ({
	ItemsService: vi.fn().mockImplementation((collection: string) => ({
		readByQuery: (query: unknown) => itemReadByQuery(collection, query),
	})),
}));

vi.mock('../services/import-export.js', () => ({
	ExportService: vi.fn(),
	ImportService: vi.fn(),
}));

vi.mock('../services/revisions.js', () => ({
	RevisionsService: vi.fn(),
}));

vi.mock('../services/utils.js', () => ({
	UtilsService: vi.fn(),
}));

vi.mock('../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js', () => ({ fetchAllowedFields }));

vi.mock('../database/index.js', () => ({
	getDatabase: vi.fn(),
}));

vi.mock('../auth/utils/resolve-login-redirect.js', () => ({
	resolveLoginRedirect: vi.fn(),
}));

vi.mock('../cache.js', () => ({
	clearSystemCache: vi.fn(),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		error: vi.fn(),
		warn: loggerWarn,
	})),
}));

vi.mock('../middleware/collection-exists.js', () => ({
	default: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));

vi.mock('../middleware/respond.js', () => ({
	respond: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));

vi.mock('../utils/generate-hash.js', () => ({
	generateHash: vi.fn(),
}));

vi.mock('../utils/generate-translations.js', () => ({
	generateTranslations: vi.fn(),
}));

vi.mock('../utils/sanitize-query.js', () => ({
	sanitizeQuery: vi.fn(),
}));

const { default: router } = await import('./utils.js');

function makeAccountability(overrides: Partial<Accountability> = {}): Accountability {
	return {
		user: 'user-id',
		role: null,
		roles: [],
		admin: false,
		app: true,
		ip: null,
		...overrides,
	};
}

function makeSchema() {
	return {
		collections: {
			articles: {
				primary: 'id',
				fields: {
					id: { type: 'integer' },
					title: { type: 'string' },
					summary: { type: 'text' },
					views: { type: 'integer' },
					published: { type: 'boolean' },
					owner: { type: 'uuid' },
					metadata: { type: 'json' },
					created_at: { type: 'dateTime' },
				},
			},
			pages: {
				primary: 'id',
				fields: {
					id: { type: 'integer' },
					title: { type: 'string' },
				},
			},
		},
		relations: [],
	};
}

async function callGlobalSearch(overrides: Parameters<typeof createMockRequest>[0] = {}) {
	const req = createMockRequest({
		method: 'POST',
		body: { query: 'article' },
		accountability: makeAccountability(),
		schema: makeSchema(),
		...overrides,
	});

	const res = createMockResponse();
	const next = vi.fn();

	const [handler] = getRouteHandler(router, 'POST', '/global-search');
	await handler!.handle(req, res, next);

	return { req, res, next };
}

describe('utils global search controller', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		fetchAllowedFields.mockResolvedValue(['*']);

		readSingleton.mockResolvedValue({
			global_search_config: {
				triggerRate: 150,
				collections: [
					{
						collection: 'articles',
						fields: ['title'],
					},
				],
			},
		});

		readByQuery.mockResolvedValue([{ collection: 'articles', meta: { display_template: '{{title}}' } }]);
		itemReadByQuery.mockResolvedValue([{ id: 1, title: 'Alpha', summary: 'Published article' }]);
	});

	afterEach(() => {
		performanceNowSpy?.mockRestore();
		performanceNowSpy = null;
	});

	test('returns empty results below the minimum query length', async () => {
		const req = createMockRequest({
			method: 'POST',
			body: { query: 'a' },
			accountability: makeAccountability(),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'POST', '/global-search');
		await handler!.handle(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith({ data: {} });
		expect(readSingleton).not.toHaveBeenCalled();
	});

	test('blocks authenticated users without app access', async () => {
		const req = createMockRequest({
			method: 'POST',
			body: { query: 'article' },
			accountability: makeAccountability({ app: false }),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'POST', '/global-search');
		await handler!.handle(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
		expect(res.json).not.toHaveBeenCalled();
		expect(readSingleton).not.toHaveBeenCalled();
	});

	test('logs slow global search requests without the search query', async () => {
		performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(1_001);
		readSingleton.mockResolvedValue({ global_search_config: null });

		const req = createMockRequest({
			method: 'POST',
			body: { query: 'private search' },
			accountability: makeAccountability(),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'POST', '/global-search');
		await handler!.handle(req, res, next);

		expect(next).not.toHaveBeenCalled();

		expect(loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				durationMs: 1001,
				thresholdMs: 1000,
				configuredCollections: [],
				resultCounts: {},
				slowestCollection: null,
			}),
			'Slow global search request',
		);

		expect(JSON.stringify(loggerWarn.mock.calls[0])).not.toContain('private search');
	});

	test('builds bounded item queries from readable searchable fields', async () => {
		readSingleton.mockResolvedValue({
			global_search_config: {
				triggerRate: 150,
				collections: [
					{
						collection: 'articles',
						fields: ['title', 'published', 'metadata'],
						descriptionField: 'summary',
						filter: { status: { _eq: 'published' } },
						sort: '-created_at',
						limit: 50,
					},
				],
			},
		});

		fetchAllowedFields.mockResolvedValue(['id', 'title', 'published', 'summary', 'created_at']);

		const { res, next } = await callGlobalSearch({ body: { query: 'true' } });

		expect(next).not.toHaveBeenCalled();

		expect(itemReadByQuery).toHaveBeenCalledWith('articles', {
			filter: {
				_and: [
					{ status: { _eq: 'published' } },
					{
						_or: [{ title: { _icontains: 'true' } }, { published: { _eq: true } }],
					},
				],
			},
			fields: ['id', 'title', 'summary'],
			limit: 25,
			sort: ['-created_at'],
		});

		expect(res.json).toHaveBeenCalledWith({
			data: {
				articles: [{ id: 1, title: 'Alpha', summary: 'Published article' }],
			},
		});
	});

	test('skips collections with no readable searchable fields', async () => {
		fetchAllowedFields.mockResolvedValue(['id']);

		const { res, next } = await callGlobalSearch();

		expect(next).not.toHaveBeenCalled();
		expect(itemReadByQuery).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith({ data: {} });
	});

	test('uses exact filters for numeric and uuid search fields', async () => {
		const owner = '550e8400-e29b-41d4-a716-446655440000';

		readSingleton.mockResolvedValue({
			global_search_config: {
				triggerRate: 150,
				collections: [
					{
						collection: 'articles',
						fields: ['views', 'owner'],
					},
				],
			},
		});

		await callGlobalSearch({ body: { query: owner } });

		expect(itemReadByQuery).toHaveBeenCalledWith(
			'articles',
			expect.objectContaining({
				filter: {
					_or: [{ owner: { _eq: owner } }],
				},
			}),
		);

		itemReadByQuery.mockClear();

		await callGlobalSearch({ body: { query: '42' } });

		expect(itemReadByQuery).toHaveBeenCalledWith(
			'articles',
			expect.objectContaining({
				filter: {
					_or: [{ views: { _eq: 42 } }],
				},
			}),
		);
	});

	test('returns partial results when one configured collection fails', async () => {
		readSingleton.mockResolvedValue({
			global_search_config: {
				triggerRate: 150,
				collections: [
					{
						collection: 'articles',
						fields: ['title'],
					},
					{
						collection: 'pages',
						fields: ['title'],
					},
				],
			},
		});

		readByQuery.mockResolvedValue([
			{ collection: 'articles', meta: { display_template: '{{title}}' } },
			{ collection: 'pages', meta: { display_template: '{{title}}' } },
		]);

		itemReadByQuery.mockImplementation((collection: string) => {
			if (collection === 'pages') throw new Error('no access');
			return Promise.resolve([{ id: 1, title: 'Alpha' }]);
		});

		const { res, next } = await callGlobalSearch();

		expect(next).not.toHaveBeenCalled();

		expect(res.json).toHaveBeenCalledWith({
			data: {
				articles: [{ id: 1, title: 'Alpha' }],
			},
		});
	});
});
