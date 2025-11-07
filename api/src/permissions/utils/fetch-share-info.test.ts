import type { AbstractServiceOptions } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import { _fetchShareInfo, type ShareInfo } from './fetch-share-info.js';
import { SharesService } from '../../services/shares.js';

vi.mock('../../services/shares.js', () => ({
	SharesService: vi.fn(),
}));

describe('fetch-share-info', () => {
	test('should handle share with null user_created (issue #25774)', async () => {
		const mockReadOne = vi.fn();

		const mockContext: AbstractServiceOptions = {
			schema: {} as any,
			knex: {} as any,
		};

		vi.mocked(SharesService).mockImplementation(
			() =>
				({
					readOne: mockReadOne,
				}) as any,
		);

		const mockShareData: ShareInfo = {
			collection: 'documents',
			item: 'doc-999',
			role: 'viewer',
			user_created: null,
		};

		mockReadOne.mockResolvedValue(mockShareData);

		const result = await _fetchShareInfo('share-999', mockContext);

		expect(result).toEqual(mockShareData);
	});
});
