import { isPermissionEmpty } from '@/utils/is-permission-empty';
import { expect, test } from 'vitest';

test('Returns true if all fields are missing', () => {
	const perm: any = {};

	expect(isPermissionEmpty(perm)).toBe(true);
});

test('Returns true if fields is empty, others are missing', () => {
	const perm: any = {
		fields: [],
	};

	expect(isPermissionEmpty(perm)).toBe(true);
});

test('Returns true fields, validation are empty, others are missing', () => {
	const perm: any = {
		fields: [],
		validation: {},
	};

	expect(isPermissionEmpty(perm)).toBe(true);
});

test('Returns true fields, validation, presets are empty, permissions is missing', () => {
	const perm: any = {
		fields: [],
		validation: {},
		presets: {},
	};

	expect(isPermissionEmpty(perm)).toBe(true);
});

test('Returns true if fields, validation, presets, and permissions is empty', () => {
	const perm: any = {
		fields: [],
		validation: {},
		presets: {},
		permissions: {},
	};

	expect(isPermissionEmpty(perm)).toBe(true);
});
