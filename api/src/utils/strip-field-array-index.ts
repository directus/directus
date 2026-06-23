import { splitFieldPath } from './split-field-path.js';

/**
 * Remove array index access (e.g. `locale[0]` or `locale.0`) from a field path.
 *
 * Index access is only meaningful when rendering a value (for example in a display or preview URL
 * template), not when selecting fields. The `fields` query parameter is a projection, so the full
 * relation is selected and the consumer indexes into the result. Without this, an indexed path is
 * treated as an unknown field name and the relation is silently dropped.
 *
 * Brackets inside function arguments (e.g. `json(data, items[0])`) are left untouched.
 */
export function stripFieldArrayIndex(field: string): string {
	return splitFieldPath(field)
		.map((segment) => (segment.includes('(') ? segment : segment.replace(/\[\d+\]/g, '')))
		.filter((segment) => !/^\d+$/.test(segment))
		.join('.');
}
