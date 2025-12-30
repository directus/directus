import { isFieldAllowed } from './is-field-allowed';
import { ActionPermission } from '@/types/permissions';
import { beforeEach, expect, it } from 'vitest';

let sample: {
	field: string;
};

beforeEach(() => {
	sample = {
		field: 'test_field',
	};
});

it('should be disallowed if permission contains no fields (undefined)', () => {
	const mockPermission = {} as ActionPermission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(false);
});

it('should be disallowed if permission contains no fields ([])', () => {
	const mockPermission = {
		fields: [] as string[],
	} as ActionPermission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(false);
});

it('should be allowed if permission includes all fields', () => {
	const mockPermission = {
		fields: ['*'],
	} as ActionPermission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(true);
});

it('should be allowed if permission includes field', () => {
	const mockPermission = {
		fields: [sample.field],
	} as ActionPermission;

	const result = isFieldAllowed(mockPermission, sample.field);

	expect(result).toBe(true);
});
