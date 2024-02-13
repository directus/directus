import { beforeEach, expect, it } from 'vitest';

import { randomIdentifier } from '@directus/random';
import { Permission } from '@directus/types';
import { isFieldAllowed } from './is-field-allowed';

let sample: {
	field: string;
};

beforeEach(() => {
	sample = {
		field: randomIdentifier(),
	};
});

it('should be disallowed if permission contains no fields (null)', () => {
	const mockPermission = {
		fields: null,
	} as Permission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(false);
});

it('should be disallowed if permission contains no fields ([])', () => {
	const mockPermission = {
		fields: [] as string[],
	} as Permission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(false);
});

it('should be allowed if permission includes all fields', () => {
	const mockPermission = {
		fields: ['*'],
	} as Permission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(true);
});

it('should be allowed if permission includes field', () => {
	const mockPermission = {
		fields: [sample.field],
	} as Permission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(true);
});
