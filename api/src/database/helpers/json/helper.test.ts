import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { JsonHelper } from './helper.js';

// Create a concrete implementation for testing since JsonHelper is abstract
class TestJsonHelper extends JsonHelper {
	protected async checkSupport(): Promise<boolean> {
		return true;
	}
}

const VALID_TEST_CASES = [
	{ input: 'json(field.path)', expected: { field: 'field', path: '.path' } },
	{ input: 'json(data.user.name)', expected: { field: 'data', path: '.user.name' } },
	{ input: 'json(metadata.settings.theme.color)', expected: { field: 'metadata', path: '.settings.theme.color' } },
	{ input: 'json(  field.path  )', expected: { field: 'field', path: '.path' } },
	{ input: 'json(user_data.profile)', expected: { field: 'user_data', path: '.profile' } },
	{ input: 'json(data.items[0].name)', expected: { field: 'data', path: '.items[0].name' } },
	{ input: 'json(data.items[*].name)', expected: { field: 'data', path: '.items[*].name' } },
];

const INVALID_TEST_CASES = [
	{ input: 'field.path)', expectedError: 'Invalid json() syntax' },
	{ input: 'json(field.path', expectedError: 'Invalid json() syntax' },
	{ input: 'json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json(   )', expectedError: 'Invalid json() syntax' },
	{ input: ' json()', expectedError: 'Invalid json() syntax' },
	{ input: 'json() ', expectedError: 'Invalid json() syntax' },
	{ input: 'json(fieldonly)', expectedError: 'Invalid json() syntax' },
	{ input: 'json(.path.to.field)', expectedError: 'Invalid json() syntax' },
];

describe('JsonHelper', () => {
	function createHelper() {
		const mockKnex = {} as Knex;
		const helper = new TestJsonHelper(mockKnex);
		return { helper };
	}

	describe('parseJsonFunction', () => {
		describe('valid inputs', () => {
			test.each(VALID_TEST_CASES)('parses "$input" to field="$expected.field" path="$expected.path"', ({ input, expected }) => {
				const { helper } = createHelper();
				const result = helper.parseJsonFunction(input);

				expect(result).toEqual(expected);
			});
		});

		describe('invalid inputs', () => {
			test.each(INVALID_TEST_CASES)('throws for "$input"', ({ input, expectedError }) => {
				const { helper } = createHelper();

				expect(() => helper.parseJsonFunction(input)).toThrow(expectedError);
			});
		});
	});

	describe('supported', () => {
		test('returns cached value on subsequent calls', async () => {
			const { helper } = createHelper();

			// Mock the checkSupport method to track calls
			const checkSupportSpy = vi.spyOn(helper as any, 'checkSupport');

			const result1 = await helper.supported();
			const result2 = await helper.supported();
			const result3 = await helper.supported();

			expect(result1).toBe(true);
			expect(result2).toBe(true);
			expect(result3).toBe(true);

			// checkSupport should only be called once
			expect(checkSupportSpy).toHaveBeenCalledTimes(1);
		});
	});
});
