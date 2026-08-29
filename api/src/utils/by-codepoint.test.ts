import { describe, expect, test } from 'vitest';
import { byCodepoint } from './by-codepoint.js';

describe('byCodepoint', () => {
	test('does not apply locale-aware collation', () => {
		// Under a locale-aware sort (e.g. localeCompare), 'a' and 'A' can be treated as equal or reordered.
		// Codepoint order keeps uppercase strictly before lowercase, since 'A' (65) < 'a' (97).
		expect(['a', 'A'].sort(byCodepoint)).toEqual(['A', 'a']);
	});
});
