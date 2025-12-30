import { isValidJSON } from './is-valid-json.js';
import { describe, expect, it } from 'vitest';

describe('isValidJSON', () => {
	it('returns true if JSON is valid', () => {
		const result = isValidJSON(`{"name": "Directus"}`);
		expect(result).toEqual(true);
	});

	it('returns false if JSON is invalid', () => {
		const result = isValidJSON(`{"name: Directus"}`);
		expect(result).toEqual(false);
	});
});
