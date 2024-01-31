import { it, expect } from 'vitest';
import { isAllowed } from './is-allowed.js';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeAll, vi, describe } from 'vitest';
import { Filter, Permission } from '@directus/types';

let permissions: Permission[] = [];
const isAdmin = false;

beforeAll(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			initialState: {
				permissionsStore: {
					permissions,
				},
				userStore: {
					isAdmin,
				},
			},
		}),
	);
});

describe('update', () => {
	const collection = 'example';
	const action = 'update';

	permissions = [
		{
			role: '33fb7ff0-3bb2-4bce-8ac4-49d34b6580ec',
			collection,
			action,
			permissions: {
				update_allowed: {
					_eq: true,
				},
			},
			validation: null,
			presets: null,
			fields: ['*'],
		},
	];

	it('should be allowed if item value matches permission rule', () => {
		const value = { update_allowed: true };

		expect(isAllowed(collection, action, value)).toBe(true);
	});

	it('should be disallowed if item value does not match permission rule', () => {
		const value = { update_allowed: false };

		expect(isAllowed(collection, action, value)).toBe(false);
	});

	// TODO: Test for temporary workaround, needs to be revisited after clean-up of workaround
	it('should be always allowed if rule contains relational fields', () => {
		const rules: Filter = {
			nested_collection: {
				update_allowed: {
					_eq: true,
				},
			},
		};

		permissions[0]!.permissions = rules;

		const value = {
			// Will be key of related item
			nested_collection: 1,
		};

		expect(isAllowed(collection, action, value)).toBe(true);
	});
});
