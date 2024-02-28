import { describe, expect, test } from 'vitest';
import { validateUuid } from './validate-uuid.js';

describe('should pass validation', () => {
	test('v1', () => {
		expect(validateUuid('e591754c-d673-11ee-a506-0242ac120002')).toBe(true);
	});

	test('v4', () => {
		expect(validateUuid('4b9adc65-4ad8-4242-9144-fbfc58400d74')).toBe(true);
	});

	test('v7', () => {
		expect(validateUuid('018df14d-1309-7226-9ed7-ffbfecad6b5f')).toBe(true);
	});

	// https://github.com/directus/directus/issues/21573
	test('example from issue 21573', () => {
		expect(validateUuid('dc60771a-d86d-e7a3-79b1-5277050cbc99')).toBe(true);
	});
});
