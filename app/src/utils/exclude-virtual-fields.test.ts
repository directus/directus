import type { Field } from '@directus/types';
import { expect, test } from 'vitest';
import { excludeVirtualFieldNames, excludeVirtualFields, isVirtualFieldName } from '@/utils/exclude-virtual-fields';

// ── isVirtualFieldName ────────────────────────────────────────────────────────

test('isVirtualFieldName returns true for fields prefixed with $', () => {
	expect(isVirtualFieldName('$thumbnail')).toBe(true);
	expect(isVirtualFieldName('$count')).toBe(true);
});

test('isVirtualFieldName returns false for regular field names', () => {
	expect(isVirtualFieldName('id')).toBe(false);
	expect(isVirtualFieldName('title')).toBe(false);
	expect(isVirtualFieldName('')).toBe(false);
});

// ── excludeVirtualFields ──────────────────────────────────────────────────────

test('excludeVirtualFields returns empty array for empty input', () => {
	expect(excludeVirtualFields([])).toEqual([]);
});

test('excludeVirtualFields filters out alias-type fields', () => {
	const fields: Field[] = [
		makeField('id', 'integer'),
		makeField('title', 'string'),
		makeField('o2m', 'alias'),
		makeField('m2m', 'alias'),
	];

	expect(excludeVirtualFields(fields)).toEqual(['id', 'title']);
});

test('excludeVirtualFields filters out fields whose name starts with $', () => {
	const fields: Field[] = [
		makeField('id', 'integer'),
		makeField('$thumbnail', 'string'),
		makeField('title', 'string'),
	];

	expect(excludeVirtualFields(fields)).toEqual(['id', 'title']);
});

test('excludeVirtualFields filters out both alias-type and $-prefixed fields', () => {
	const fields: Field[] = [
		makeField('id', 'integer'),
		makeField('title', 'string'),
		makeField('o2m', 'alias'),
		makeField('$thumbnail', 'string'),
	];

	expect(excludeVirtualFields(fields)).toEqual(['id', 'title']);
});

test('excludeVirtualFields returns all field names when no virtual fields are present', () => {
	const fields: Field[] = [makeField('id', 'integer'), makeField('title', 'string'), makeField('status', 'string')];

	expect(excludeVirtualFields(fields)).toEqual(['id', 'title', 'status']);
});

// ── excludeVirtualFieldNames ──────────────────────────────────────────────────

test('excludeVirtualFieldNames returns empty array for empty input', () => {
	expect(excludeVirtualFieldNames([])).toEqual([]);
});

test('excludeVirtualFieldNames filters out field names starting with $', () => {
	expect(excludeVirtualFieldNames(['id', '$thumbnail', 'title', '$count'])).toEqual(['id', 'title']);
});

test('excludeVirtualFieldNames keeps all names when none start with $', () => {
	expect(excludeVirtualFieldNames(['id', 'title', 'status'])).toEqual(['id', 'title', 'status']);
});

test('excludeVirtualFieldNames removes all names when all start with $', () => {
	expect(excludeVirtualFieldNames(['$thumbnail', '$count'])).toEqual([]);
});

// ── helpers ───────────────────────────────────────────────────────────────────

function makeField(field: string, type: Field['type']): Field {
	return {
		collection: 'test_collection',
		field,
		type,
		schema: null,
		meta: null,
		name: field,
	};
}
