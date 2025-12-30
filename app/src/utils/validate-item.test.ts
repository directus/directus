import { validateItem } from '@/utils/validate-item';
import { DeepPartial, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test } from 'vitest';

const fields: DeepPartial<Field>[] = [
	{
		field: 'id',
		collection: 'users',
		type: 'integer',
		name: 'ID',
		meta: {
			required: true,
		},
		schema: null,
	},
	{
		field: 'name',
		collection: 'users',
		type: 'string',
		name: 'Name',
		meta: {
			required: true,
		},
		schema: null,
	},
	{
		field: 'email',
		collection: 'users',
		type: 'string',
		name: 'Email',
		schema: null,
	},
	{
		field: 'role',
		collection: 'users',
		type: 'integer',
		name: 'Role',
		meta: {
			required: true,
		},
		schema: null,
	},
];

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: () => (_collection, field) => {
				if (field === 'role') {
					return [{ some: 'relation' }];
				}

				return [];
			},
		}),
	);
});

test('Required fields', () => {
	let result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: [1, 2],
		},
		fields as Field[],
		true,
	);

	expect(result.length).toEqual(0);

	result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: [],
		},
		fields as Field[],
		true,
	);

	expect(result.length).toEqual(1);
});
