import type { FieldOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { isFieldNullable } from './is-field-nullable.js';

test('Returns true if "nullable" is set on the field', () => {
	const field = { nullable: true } as FieldOverview;

	expect(isFieldNullable(field)).toBe(true);
});

test('Returns true if "generated" is set on the field', () => {
	const field = { nullable: false, generated: true } as FieldOverview;

	expect(isFieldNullable(field)).toBe(true);
});

test('Returns true if field has a special flag that generates a value', () => {
	const field = { nullable: false, generated: false, special: ['uuid'] } as FieldOverview;

	expect(isFieldNullable(field)).toBe(true);
});

test('Returns false if the field does not meet any of the conditions ', () => {
	const field = { nullable: false, generated: false, special: [] as string[] } as FieldOverview;

	expect(isFieldNullable(field)).toBe(false);
});
