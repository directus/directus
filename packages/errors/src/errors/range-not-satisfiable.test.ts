import type { Range } from '@directus/types';
import { expect, test } from 'vitest';
import { messageConstructor } from './range-not-satisfiable.js';

let range: Range;

test('Constructs message with given range', () => {
	range = {
		start: 0,
		end: 1000,
	};

	expect(messageConstructor({ range })).toBe(
		`Range "${range.start}-${range.end}" is invalid or the file's size doesn't match the requested range.`,
	);
});
