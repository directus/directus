import { describe, expect, it } from 'vitest';
import { getSimpleHash } from './get-simple-hash.js';

describe('getSimpleHash', () => {
	it('returns "364492" for string "test"', () => {
		expect(getSimpleHash('test')).toBe('364492');
	});

	it('returns "28cb67ba" for stringified object "{ key: \'value\' }"', () => {
		expect(getSimpleHash(JSON.stringify({ key: 'value' }))).toBe('28cb67ba');
	});
});
