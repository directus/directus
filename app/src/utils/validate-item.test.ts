import { DeepPartial, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
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

describe('group field validation', () => {
	const collection = 'test_collection';

	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: () => () => [],
			}),
		);
	});

	// A group that is hidden+optional by default and becomes visible+required when status is 'active'
	const groupConditionallyShown: DeepPartial<Field>[] = [
		{
			field: 'status',
			collection,
			type: 'string',
			name: 'Status',
			meta: { required: false },
			schema: null,
		},
		{
			field: 'section',
			collection,
			type: 'alias',
			name: 'Section',
			meta: {
				hidden: true,
				required: false,
				special: ['group'],
				conditions: [{ rule: { status: { _eq: 'active' } }, hidden: false, required: true }],
			} as any,
			schema: null,
		},
		{
			field: 'notes',
			collection,
			type: 'string',
			name: 'Notes',
			meta: { group: 'section', required: false },
			schema: null,
		},
	];

	// A group that is visible+required by default and becomes hidden when status is 'archived'
	const groupConditionallyHidden: DeepPartial<Field>[] = [
		{
			field: 'status',
			collection,
			type: 'string',
			name: 'Status',
			meta: { required: false },
			schema: null,
		},
		{
			field: 'section',
			collection,
			type: 'alias',
			name: 'Section',
			meta: {
				hidden: false,
				required: true,
				special: ['group'],
				conditions: [{ rule: { status: { _eq: 'archived' } }, hidden: true }],
			} as any,
			schema: null,
		},
		{
			field: 'notes',
			collection,
			type: 'string',
			name: 'Notes',
			meta: { group: 'section', required: false },
			schema: null,
		},
	];

	it('validates a child field when its group is conditionally made visible and required', () => {
		const processedFields = pushGroupOptionsDown(groupConditionallyShown as Field[]);
		const errors = validateItem({ status: 'active', notes: null }, processedFields, false);
		expect(errors.map((e) => e.field)).toContain('notes');
	});

	it('does not validate a child field when its statically required group is hidden via a condition', () => {
		const processedFields = pushGroupOptionsDown(groupConditionallyHidden as Field[]);
		const errors = validateItem({ status: 'archived', notes: null }, processedFields, false);
		expect(errors.map((e) => e.field)).not.toContain('notes');
	});
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
