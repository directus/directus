import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getStorage } from '../storage/index.js';
import { useStore } from '../utils/store.js';
import { UtilsService } from './utils.js';

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

vi.mock('../utils/store.js', () => ({
	useStore: vi.fn().mockReturnValue((callback: any) =>
		callback({
			get: vi.fn().mockResolvedValue(false),
			set: vi.fn().mockResolvedValue(undefined),
		}),
	),
}));

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
	const chainable: any = {
		where: vi.fn().mockImplementation((_col: string, id: string) => {
			const filtered = files.filter((f) => f.id === id);
			return { ...chainable, then: (resolve: any) => resolve(filtered), [Symbol.toStringTag]: 'Promise' };
		}),
		whereIn: vi.fn().mockImplementation((_col: string, ids: string[]) => {
			const filtered = files.filter((f) => ids.includes(f.id));
			return { ...chainable, then: (resolve: any) => resolve(filtered), [Symbol.toStringTag]: 'Promise' };
		}),
		then: (resolve: any) => resolve(files),
		[Symbol.toStringTag]: 'Promise',
	};

	const knex: any = {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue(chainable),
		}),
	};

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

		test('throws when clearing is already in progress', async () => {
			vi.mocked(useStore).mockReturnValueOnce(((callback: any) =>
				callback({
					get: vi.fn().mockResolvedValue(true),
					set: vi.fn(),
				})) as any);

			const service = new UtilsService({
				schema: mockSchema,
			});

			await expect(service.clearAssetVariants()).rejects.toThrow('Asset variant clearing is already in progress');
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
				schema: mockSchema,
			});

			await service.clearAssetVariants();

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
				schema: mockSchema,
			});

			await service.clearAssetVariants();

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
				schema: mockSchema,
			});

			await service.clearAssetVariants();

			expect(disk.bulkDelete).toHaveBeenCalledWith(['abc__hash1.jpg', 'abc__hash2.jpg']);
			expect(disk.delete).not.toHaveBeenCalled();
		});

		test('accepts array of file IDs', async () => {
			const files = [
				{ id: '1', filename_disk: 'abc.jpg', storage: 'local' },
				{ id: '2', filename_disk: 'def.jpg', storage: 'local' },
			];

			const storageFiles = new Map([
				['abc', ['abc.jpg', 'abc__hash1.jpg']],
				['def', ['def.jpg', 'def__hash1.jpg']],
			]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				schema: mockSchema,
			});

			await service.clearAssetVariants({ file: ['1', '2'] });

			expect(disk.delete).toHaveBeenCalledTimes(2);
		});

		test('handles custom filename_disk with subdirectory', async () => {
			const files = [{ id: '1', filename_disk: 'subfolder/photo.jpg', storage: 'local' }];

			const storageFiles = new Map([['photo', ['subfolder/photo.jpg', 'photo__hash1.jpg', 'photo__hash2.webp']]]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				schema: mockSchema,
			});

			await service.clearAssetVariants({ file: ['1'] });

			expect(disk.delete).toHaveBeenCalledTimes(2);
			expect(disk.delete).toHaveBeenCalledWith('photo__hash1.jpg');
			expect(disk.delete).toHaveBeenCalledWith('photo__hash2.webp');
		});

		test('does nothing when no variants exist', async () => {
			const files = [{ id: '1', filename_disk: 'abc.jpg', storage: 'local' }];

			const storageFiles = new Map([['abc', ['abc.jpg']]]);

			const { disk } = createMockDisk({ files: storageFiles });

			vi.mocked(getStorage).mockResolvedValue({
				location: () => disk,
			} as any);

			const knex = createMockKnex(files);

			const service = new UtilsService({
				knex,
				schema: mockSchema,
			});

			await service.clearAssetVariants();

			expect(disk.delete).not.toHaveBeenCalled();
		});
	});
});
