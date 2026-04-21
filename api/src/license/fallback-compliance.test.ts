import { describe, expect, test, vi } from 'vitest';
import { fetchUserCount } from '../utils/fetch-user-count/fetch-user-count.js';
import { getAuthProviders } from '../utils/get-auth-providers.js';
import { getProjectFallbackCompliance, isExternalAuthSafeForFallback } from './fallback-compliance.js';

vi.mock('../utils/get-auth-providers.js', () => ({
	getAuthProviders: vi.fn(),
}));

vi.mock('../utils/fetch-user-count/fetch-user-count.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../utils/fetch-user-count/fetch-user-count.js')>();

	return {
		...actual,
		fetchUserCount: vi.fn(),
	};
});

const mockedFetchUserCount = vi.mocked(fetchUserCount);
const mockedGetAuthProviders = vi.mocked(getAuthProviders);

describe('isExternalAuthSafeForFallback', () => {
	test('treats fallback as safe when external auth is already disabled in settings', async () => {
		mockedGetAuthProviders.mockReturnValue([{ name: 'openid', driver: 'openid' }] as any);

		const knex = createKnex({
			settings: { sso_disabled: true },
			externalAuthUserCount: 2,
			collections: [],
		});

		await expect(isExternalAuthSafeForFallback(knex, false)).resolves.toBe(true);
	});

	test('treats fallback as unsafe when external auth still has runtime dependencies', async () => {
		mockedGetAuthProviders.mockReturnValue([{ name: 'openid', driver: 'openid' }] as any);

		const knex = createKnex({
			settings: { sso_disabled: false },
			externalAuthUserCount: 1,
			collections: [],
		});

		await expect(isExternalAuthSafeForFallback(knex, false)).resolves.toBe(false);
	});
});

describe('getProjectFallbackCompliance', () => {
	test('returns compliant only when numeric limits and SSO fallback safety are satisfied', async () => {
		mockedGetAuthProviders.mockReturnValue([{ name: 'openid', driver: 'openid' }] as any);
		mockedFetchUserCount.mockResolvedValue({ admin: 1, app: 2, api: 10 });

		const knex = createKnex({
			settings: { sso_disabled: false },
			externalAuthUserCount: 1,
			collections: [
				{ collection: 'posts', excluded: false },
				{ collection: 'pages', excluded: false },
				{ collection: 'authors', excluded: false },
			],
		});

		await expect(getProjectFallbackCompliance(knex)).resolves.toEqual({
			compliant: false,
			collections: true,
			seats: true,
			sso: false,
		});
	});
});

function createKnex(options: {
	settings: { sso_disabled: boolean };
	externalAuthUserCount: number;
	collections: { collection: string; excluded: boolean }[];
}) {
	const settingsQuery = {
		first: vi.fn().mockResolvedValue(options.settings),
	};

	const settingsFrom = {
		from: vi.fn().mockReturnValue(settingsQuery),
	};

	const usersQuery = {
		whereIn: vi.fn().mockReturnThis(),
		count: vi.fn().mockResolvedValue([{ count: String(options.externalAuthUserCount) }]),
	};

	const collectionsQuery = {
		select: vi.fn().mockResolvedValue(options.collections),
	};

	const knex = vi.fn((table: string) => {
		if (table === 'directus_users') {
			return usersQuery;
		}

		if (table === 'directus_collections') {
			return collectionsQuery;
		}

		throw new Error(`Unexpected table ${table}`);
	}) as any;

	knex.select = vi.fn().mockReturnValue(settingsFrom);

	return knex;
}
