import { test, expect } from 'vitest';

import { getStringifiedValue } from '@/utils/get-stringified-value';

test(`Returns empty string when input is undefined`, () => {
	expect(getStringifiedValue(undefined, true)).toBe('');
});

test(`Returns JSON stringified value when input is an object`, () => {
	expect(getStringifiedValue({ key: 'value' }, false)).toBe('{\n    "key": "value"\n}');
});

test(`Do not double escape quotes for a string input`, () => {
	// Example scenario for operations in Flows
	expect(getStringifiedValue('"{{my_operation}}"', true)).toBe('"{{my_operation}}"');
});
