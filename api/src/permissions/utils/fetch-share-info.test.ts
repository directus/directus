import type { AbstractServiceOptions } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { _fetchShareInfo, type ShareInfo } from './fetch-share-info.js';
import { SharesService } from '../../services/shares.js';

vi.mock('../../services/shares.js', () => ({
	SharesService: vi.fn(),
}));

vi.mock('../cache.js', () => ({
	useCache: vi.fn(() => ({
		get: vi.fn(),
		set: vi.fn(),
		clear: vi.fn(),
	})),
}));

describe('fetch-share-info', () => {
	let mockReadOne: ReturnType<typeof vi.fn>;
	let mockContext: AbstractServiceOptions;

	beforeEach(() => {
		vi.clearAllMocks();

		mockContext = {
			schema: {} as any,
			knex: {} as any,
		};

		mockReadOne = vi.fn();

		vi.mocked(SharesService).mockImplementation(
			() =>
				({
					readOne: mockReadOne,
				}) as any,
		);
	});

	describe('_fetchShareInfo', () => {
		test('should fetch share info with correct fields', async () => {
			const mockShareData: ShareInfo = {
				collection: 'articles',
				item: 'test-item-id',
				role: 'test-role',
				user_created: {
					id: 'user-123',
					role: 'admin',
				},
			};

			mockReadOne.mockResolvedValue(mockShareData);

			const result = await _fetchShareInfo('share-123', mockContext);

			expect(result).toEqual(mockShareData);

			expect(mockReadOne).toHaveBeenCalledWith('share-123', {
				fields: ['collection', 'item', 'role', 'user_created.id', 'user_created.role'],
			});
		});

		test('should handle share with null user_created (issue #25774)', async () => {
			const mockShareData: ShareInfo = {
				collection: 'documents',
				item: 'doc-999',
				role: 'viewer',
				user_created: null,
			};

			mockReadOne.mockResolvedValue(mockShareData);

			const result = await _fetchShareInfo('share-999', mockContext);

			expect(result).toEqual(mockShareData);
			expect(result.user_created).toBeNull();
		});

		test('should propagate errors from SharesService', async () => {
			const mockError = new Error('Share not found');
			mockReadOne.mockRejectedValue(mockError);

			await expect(_fetchShareInfo('invalid-share', mockContext)).rejects.toThrow('Share not found');
		});
	});

	describe('ShareInfo type', () => {
		test('should handle all valid ShareInfo properties', async () => {
			const validShareInfo: ShareInfo = {
				collection: 'test_collection',
				item: 'item-id-123',
				role: 'admin',
				user_created: {
					id: 'user-id-456',
					role: 'editor',
				},
			};

			mockReadOne.mockResolvedValue(validShareInfo);

			const result = await _fetchShareInfo('share-123', mockContext);

			expect(result).toHaveProperty('collection');
			expect(result).toHaveProperty('item');
			expect(result).toHaveProperty('role');
			expect(result).toHaveProperty('user_created');
			expect(result.user_created).toHaveProperty('id');
			expect(result.user_created).toHaveProperty('role');
		});
	});
});
