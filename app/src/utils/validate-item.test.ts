import { DeepPartial, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { validateItem } from '@/utils/validate-item';

vi.mock('@/utils/parse-filter', () => ({
	parseFilter: (filter: any) => {
		// Simulate resolving $NOW to actual date, matching real parseFilter behavior
		const resolved = JSON.parse(JSON.stringify(filter), (_key, value) => {
			if (typeof value === 'string' && value.startsWith('$NOW')) return new Date().toISOString();
			return value;
		});

		return resolved;
	},
}));

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

test('Required relational field cleared on update via staged changes', () => {
	// When editing an existing item and removing all related items, the relational
	// interface stages the change as a `{ create, update, delete }` object rather
	// than an empty array. This must still be treated as an empty value so the
	// required validation fires (see directus/directus#27695).
	let result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: { create: [], update: [], delete: [1, 2] },
		},
		fields as Field[],
		false,
		false,
		null,
		// Two related items existed and both are being deleted -> nets to empty.
		{ role: [1, 2] },
	);

	expect(result.length).toEqual(1);

	// A staged change that still results in related items (a create) must pass.
	result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: { create: [{ some: 'value' }], update: [], delete: [1] },
		},
		fields as Field[],
		false,
		false,
		null,
		{ role: [1] },
	);

	expect(result.length).toEqual(0);

	// A partial removal that leaves related items behind must not be flagged.
	result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: { create: [], update: [], delete: [1] },
		},
		fields as Field[],
		false,
		false,
		null,
		// Three related items existed, only one is being deleted -> two remain.
		{ role: [1, 2, 3] },
	);

	expect(result.length).toEqual(0);

	// A staged update with no creates/deletes (e.g. editing an existing relation)
	// must not be treated as empty.
	result = validateItem(
		{
			id: 1,
			name: 'test',
			email: 'test@test.com',
			role: { create: [], update: [{ id: 1, some: 'value' }], delete: [] },
		},
		fields as Field[],
		false,
		false,
		null,
		{ role: [1] },
	);

	expect(result.length).toEqual(0);
});

test('Custom validation with $NOW dynamic variable does not throw', () => {
	const fieldsWithValidation: DeepPartial<Field>[] = [
		{
			field: 'publish_date',
			collection: 'articles',
			type: 'timestamp',
			name: 'Publish Date',
			meta: {
				required: false,
				validation: {
					_and: [
						{
							publish_date: {
								_gte: '$NOW',
							},
						},
					],
				},
			},
			schema: null,
		},
	];

	const futureDate = new Date(Date.now() + 86400000).toISOString();

	const result = validateItem({ publish_date: futureDate }, fieldsWithValidation as Field[], true, true);

	expect(result.length).toEqual(0);
});
