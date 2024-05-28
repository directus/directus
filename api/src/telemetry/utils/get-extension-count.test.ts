import { Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getExtensionCount, type ExtensionCount } from './get-extension-count.js';

let mockQueryEnabled: { count?: string | number } | undefined;
let mockQueryBundles: { count?: string | number } | undefined;
const mockCountEnabled = 4;
const mockCountBundles = 2;
let mockDb: Knex;

beforeEach(() => {
	mockQueryEnabled = {
		count: mockCountEnabled,
	};

	mockQueryBundles = {
		count: mockCountBundles,
	};

	mockDb = {
		count: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		whereIn: vi.fn().mockReturnThis(),
		andWhere: vi.fn().mockReturnThis(),
		distinct: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValueOnce(mockQueryEnabled).mockResolvedValueOnce(mockQueryBundles),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Subtracts bundle parents from total extensions', async () => {
	const result = await getExtensionCount(mockDb);

	expect(result).toEqual({ totalEnabled: mockCountEnabled - mockCountBundles } satisfies ExtensionCount);
});
