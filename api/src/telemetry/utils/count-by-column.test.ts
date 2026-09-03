import { describe, expect, test, vi } from 'vitest';
import { countByColumn } from './count-by-column.js';

const mockDb = (rows: Array<Record<string, unknown>>) => {
	const builder: any = {
		select: vi.fn().mockReturnThis(),
		count: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockResolvedValue(rows),
	};

	return vi.fn().mockReturnValue(builder) as any;
};

describe('countByColumn', () => {
	test('returns every known key at zero when the table is empty', async () => {
		const result = await countByColumn(mockDb([]), 'directus_operations', 'type', ['log', 'mail']);

		expect(result).toStrictEqual({ custom: { count: 0 }, log: { count: 0 }, mail: { count: 0 } });
	});

	test('counts known values by name', async () => {
		const result = await countByColumn(
			mockDb([
				{ type: 'log', count: '3' },
				{ type: 'mail', count: 2 },
			]),
			'directus_operations',
			'type',
			['log', 'mail'],
		);

		expect(result['log']).toStrictEqual({ count: 3 });
		expect(result['mail']).toStrictEqual({ count: 2 });
	});

	test('folds unknown values into custom rather than reporting their names', async () => {
		const result = await countByColumn(
			mockDb([
				{ type: 'log', count: '1' },
				{ type: 'acme-secret-operation', count: '4' },
				{ type: 'another-extension', count: '2' },
			]),
			'directus_operations',
			'type',
			['log'],
		);

		expect(result).toStrictEqual({ custom: { count: 6 }, log: { count: 1 } });
		expect(Object.keys(result)).not.toContain('acme-secret-operation');
	});

	test('folds null values into custom', async () => {
		const result = await countByColumn(mockDb([{ type: null, count: '5' }]), 'directus_oauth_clients', 'type', ['dcr']);

		expect(result['custom']).toStrictEqual({ count: 5 });
	});
});
