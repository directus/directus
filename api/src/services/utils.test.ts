import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../storage/index.js', () => ({
	getStorage: vi.fn(),
}));

vi.mock('../cache.js', () => ({
	getCache: vi.fn().mockReturnValue({ cache: null }),
	clearSystemCache: vi.fn(),
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
}));

import { getStorage } from '../storage/index.js';
import { UtilsService } from './utils.js';

const mockSchema = {} as SchemaOverview;

function createMockDisk(options: { files: Map<string, string[]>; hasBulkDelete?: boolean }) {
	const deleted: string[] = [];

	const disk: any = {
		list: async function* (prefix: string) {
			for (const [, files] of options.files) {
				for (const file of files) {
					const name = file.replace(/\.[^.]+$/, '');

					if (name.startsWith(prefix) || file.startsWith(prefix)) {
						yield file;
					}
				}
			}
		},
		delete: vi.fn(async (fp: string) => {
			deleted.push(fp);
		}),
	};

	if (options.hasBulkDelete) {
		disk.bulkDelete = vi.fn(async (fps: string[]) => {
			deleted.push(...fps);
		});
	}

	return { disk, deleted };
}

function createMockKnex(files: { id: string; filename_disk: string; storage: string }[]) {
	const knex: any = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
	};

	// Default: return all files
	knex.from.mockImplementation(() => {
		return {
			where: vi.fn().mockResolvedValue(files.filter(() => true)),
			then: (resolve: any) => resolve(files),
			[Symbol.toStringTag]: 'Promise',
		};
	});

	// Make knex thenable to resolve as files
	knex.select.mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockImplementation(() => Promise.resolve(files)),
			then: (resolve: any) => resolve(files),
			[Symbol.toStringTag]: 'Promise',
		}),
	});

	return knex;
}

describe('UtilsService', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('#clearAssetVariants', () => {
		test('throws ForbiddenError for non-admin', async () => {
			const service = new UtilsService({
				accountability: { admin: false, role: null, user: null, roles: [], ip: '', app: false },
				schema: mockSchema,
			});

			await expect(service.clearAssetVariants()).rejects.toThrow("You don't have permission to access this.");
		});

		test('deletes variants and preserves originals', async () => {
			const files = [{ id: '1', filename_disk: 'abc123.jpg', storage: 'local' }];

			const storageFiles = new Map([['abc123', ['abc123.jpg', 'abc123__hash1.jpg', 'abc123__hash2.webp']]]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				accountability: { admin: true, role: null, user: null, roles: [], ip: '', app: false },
				schema: mockSchema,
			});

			const result = await service.clearAssetVariants();

			expect(result.deleted).toBe(2);
			expect(disk.delete).toHaveBeenCalledTimes(2);
			expect(disk.delete).toHaveBeenCalledWith('abc123__hash1.jpg');
			expect(disk.delete).toHaveBeenCalledWith('abc123__hash2.webp');
		});

		test('skips files without __ variant pattern', async () => {
			const files = [{ id: '1', filename_disk: 'abc.jpg', storage: 'local' }];

			const storageFiles = new Map([['abc', ['abc.jpg', 'abcdef.jpg']]]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				accountability: { admin: true, role: null, user: null, roles: [], ip: '', app: false },
				schema: mockSchema,
			});

			const result = await service.clearAssetVariants();

			expect(result.deleted).toBe(0);
			expect(disk.delete).not.toHaveBeenCalled();
		});

		test('uses bulkDelete when available', async () => {
			const files = [{ id: '1', filename_disk: 'abc.jpg', storage: 'local' }];

			const storageFiles = new Map([['abc', ['abc.jpg', 'abc__hash1.jpg', 'abc__hash2.jpg']]]);

			const { disk } = createMockDisk({ files: storageFiles, hasBulkDelete: true });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				accountability: { admin: true, role: null, user: null, roles: [], ip: '', app: false },
				schema: mockSchema,
			});

			const result = await service.clearAssetVariants();

			expect(result.deleted).toBe(2);
			expect(disk.bulkDelete).toHaveBeenCalledWith(['abc__hash1.jpg', 'abc__hash2.jpg']);
			expect(disk.delete).not.toHaveBeenCalled();
		});

		test('returns zero when no variants exist', async () => {
			const files = [{ id: '1', filename_disk: 'abc.jpg', storage: 'local' }];

			const storageFiles = new Map([['abc', ['abc.jpg']]]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				accountability: { admin: true, role: null, user: null, roles: [], ip: '', app: false },
				schema: mockSchema,
			});

			const result = await service.clearAssetVariants();

			expect(result.deleted).toBe(0);
		});
	});
});
