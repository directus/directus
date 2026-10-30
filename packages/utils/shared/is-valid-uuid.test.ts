import { describe, expect, test } from 'vitest';
import { isValidUuid } from './is-valid-uuid.js';

describe('should pass validation', () => {
	test('v1', () => {
		expect(isValidUuid('e591754c-d673-11ee-a506-0242ac120002')).toBe(true);
	});

	test('v4', () => {
		expect(isValidUuid('4b9adc65-4ad8-4242-9144-fbfc58400d74')).toBe(true);
	});

	// https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format-04#name-uuid-version-7
	test('non-standard version "7"', () => {
		expect(isValidUuid('018df14d-1309-7226-9ed7-ffbfecad6b5f')).toBe(true);
	});

	/*
	 * The following test covers a case encountered in https://github.com/directus/directus/issues/21573 where
	 * the UUID being inserted into the database is non-standard.
	 * In this specific example, the UUID is sourced from a platform that uses "e" as the version.
	 * While this is non-standard, it is still regard as a valid UUID by database vendors
	 * and should be treated as such.
	 */
	test('non-standard version "e"', () => {
		expect(isValidUuid('dc60771a-d86d-e7a3-79b1-5277050cbc99')).toBe(true);
	});
});

describe('should not pass validation', () => {
	test('empty value', () => {
		expect(isValidUuid('')).toBe(false);
	});

	test('invalid value', () => {
		expect(isValidUuid('this-is-unequivocally-not-valid')).toBe(false);
	});
});
