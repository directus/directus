import { describe, expect, test } from 'vitest';
import { splitFieldPath } from './split-field-path.js';

const cases: [string, string[]][] = [
	['a.b.c', ['a', 'b', 'c']],
	['field', ['field']],
	['category_id.json(metadata, color)', ['category_id', 'json(metadata, color)']],
	['category_id.json(metadata, settings.theme)', ['category_id', 'json(metadata, settings.theme)']],
	['a.b.json(field, x.y.z)', ['a', 'b', 'json(field, x.y.z)']],
	['json(metadata, color)', ['json(metadata, color)']],
	['json(metadata, a.b.c)', ['json(metadata, a.b.c)']],
];

describe('splitFieldPath', () => {
	for (const [input, expected] of cases) {
		test(input, () => {
			expect(splitFieldPath(input)).toEqual(expected);
		});
	}
});
