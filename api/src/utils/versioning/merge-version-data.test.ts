import { mergeVersionsRaw } from './merge-version-data.js';
import { describe, expect, test } from 'vitest';

describe('content versioning mergeVersionsRaw', () => {
	test('No versions available', () => {
		const result = mergeVersionsRaw({ test_field: 'value' }, []);

		expect(result).toMatchObject({ test_field: 'value' });
	});

	test('Basic field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', edited_field: 'original' }, [
			{ edited_field: 'updated' },
			{ test_field: null },
		]);

		expect(result).toMatchObject({
			test_field: null,
			edited_field: 'updated',
		});
	});

	test('Relational field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', relation: null }, [
			{ relation: { create: [{ test: 'value ' }], update: [], delete: [] } },
		]);

		expect(result).toMatchObject({
			test_field: 'value',
			relation: {
				create: [{ test: 'value ' }],
				update: [],
				delete: [],
			},
		});
	});
});
