import { describe, it, expect, vi } from 'vitest';
import { getProjectId } from './get-project-id.js';
import type { Knex } from 'knex';

describe('getProjectId', () => {
	it('should return the project_id when it exists in the database', async () => {
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockResolvedValue({ project_id: 'test-project-id' }),
		} as unknown as Knex;

		const result = await getProjectId(mockDb);
		expect(result).toBe('test-project-id');
	});

	it('should return null when project_id does not exist in the database', async () => {
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockResolvedValue(null),
		} as unknown as Knex;

		const result = await getProjectId(mockDb);
		expect(result).toBeNull();
	});

	it('should handle unexpected database errors gracefully', async () => {
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockRejectedValue(new Error('Database error')),
		} as unknown as Knex;

		await expect(getProjectId(mockDb)).rejects.toThrow('Database error');
	});
});
