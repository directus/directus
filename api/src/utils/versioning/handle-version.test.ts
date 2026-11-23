import { ForbiddenError } from '@directus/errors';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { handleVersion } from './handle-version.js';

const { getVersionSavesMock } = vi.hoisted(() => ({
	getVersionSavesMock: vi.fn(),
}));

vi.mock('../../services/versions.js', () => {
	const VersionsService = vi.fn(function (this: any) {
		return this;
	});

	VersionsService.prototype.getVersionSaves = getVersionSavesMock;

	return { VersionsService };
});

vi.mock('../../services/items.js', () => {
	const ItemsService = vi.fn(function (this: any) {
		return this;
	});

	return { ItemsService };
});

function createSelfStub() {
	return {
		collection: 'articles',
		schema: {
			collections: {
				articles: {
					primary: 'id',
					fields: {},
				},
			},
			relations: [],
		},
		accountability: null,
		knex: {},
		readByQuery: vi.fn().mockResolvedValue([{ id: 1, title: 'Hello' }]),
	};
}

describe('handleVersion', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('falls back to the main item for a single-item draft request without a saved draft', async () => {
		getVersionSavesMock.mockResolvedValue([]);

		const self = createSelfStub();
		const query: Record<string, any> = { version: 'draft' };

		const result = await handleVersion(self as any, 1, query as any);

		expect(result).toEqual([{ id: 1, title: 'Hello' }]);
		expect(self.readByQuery).toHaveBeenCalledTimes(1);
		// The version param is removed so the fallback reads the main item
		expect(query.version).toBeUndefined();
	});

	test('throws ForbiddenError for a single-item request with a non-existent custom version key', async () => {
		getVersionSavesMock.mockResolvedValue([]);

		const self = createSelfStub();

		await expect(handleVersion(self as any, 1, { version: 'my-custom-version' } as any)).rejects.toThrow(
			ForbiddenError,
		);

		expect(self.readByQuery).not.toHaveBeenCalled();
	});

	test('returns an empty array for a list request without saved versions', async () => {
		getVersionSavesMock.mockResolvedValue([]);

		const self = createSelfStub();

		const result = await handleVersion(self as any, null, { version: 'draft' } as any);

		expect(result).toEqual([]);
		expect(self.readByQuery).not.toHaveBeenCalled();
	});

	test('returns the main item for a versionRaw request without a saved version', async () => {
		getVersionSavesMock.mockResolvedValue([]);

		const self = createSelfStub();

		const result = await handleVersion(self as any, 1, { version: 'draft', versionRaw: true } as any);

		expect(result).toEqual([{ id: 1, title: 'Hello' }]);
	});
});
