import { describe, expect, it } from 'vitest';
import { isPublishedVersionKey } from './versions.js';

describe('isPublishedVersionKey', () => {
	it('returns true for current published key', () => {
		expect(isPublishedVersionKey('published')).toBe(true);
	});

	it('returns true for legacy published key', () => {
		expect(isPublishedVersionKey('main')).toBe(true);
	});

	it('returns false for draft key', () => {
		expect(isPublishedVersionKey('draft')).toBe(false);
	});

	it('returns false for custom version key', () => {
		expect(isPublishedVersionKey('my-version')).toBe(false);
	});

	it('returns false for null/undefined', () => {
		expect(isPublishedVersionKey(null)).toBe(false);
		expect(isPublishedVersionKey(undefined)).toBe(false);
	});
});
