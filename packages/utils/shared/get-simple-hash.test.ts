import { getSimpleHash } from './get-simple-hash.js';
import { describe, expect, it } from 'vitest';

describe('getSimpleHash', () => {
	it('returns "364492" for string "test"', () => {
		expect(getSimpleHash('test')).toBe('364492');
	});

	it('returns "28cb67ba" for stringified object "{ key: \'value\' }"', () => {
		expect(getSimpleHash(JSON.stringify({ key: 'value' }))).toBe('28cb67ba');
	});
});
