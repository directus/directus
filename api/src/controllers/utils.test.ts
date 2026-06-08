import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';

const readSingleton = vi.fn();
const readByQuery = vi.fn();

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
	ItemsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn(),
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

vi.mock('../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js', () => ({
	fetchAllowedFields: vi.fn().mockResolvedValue(['*']),
}));

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

describe('utils global search controller', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		readSingleton.mockResolvedValue({
			global_search_config: [
				{
					collection: 'articles',
					fields: ['title'],
				},
			],
		});

		readByQuery.mockResolvedValue([]);
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
});
