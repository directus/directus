import { DeepPartial, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { validateItem } from '@/utils/validate-item';

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

// CMS-1711: Group-level conditional required validation bugs
describe('group-level conditional required validation (CMS-1711)', () => {
	const collection = 'test_collection';

	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: () => () => [],
			}),
		);
	});

	// group_one: visible + required by default, hidden when status='draft'
	// group_two: hidden + not required by default, shown + required when status='draft'
	const conditionalFields: DeepPartial<Field>[] = [
		{
			field: 'status',
			collection,
			type: 'string',
			name: 'Status',
			meta: { required: false },
			schema: null,
		},
		{
			field: 'group_one',
			collection,
			type: 'alias',
			name: 'Group One',
			meta: {
				hidden: false,
				required: true,
				special: ['group'],
				conditions: [{ rule: { status: { _eq: 'draft' } }, hidden: true }],
			} as any,
			schema: null,
		},
		{
			field: 'f1',
			collection,
			type: 'string',
			name: 'F1',
			meta: { group: 'group_one', required: false },
			schema: null,
		},
		{
			field: 'group_two',
			collection,
			type: 'alias',
			name: 'Group Two',
			meta: {
				hidden: true,
				required: false,
				special: ['group'],
				conditions: [{ rule: { status: { _eq: 'draft' } }, hidden: false, required: true }],
			} as any,
			schema: null,
		},
		{
			field: 'f2',
			collection,
			type: 'string',
			name: 'F2',
			meta: { group: 'group_two', required: false },
			schema: null,
		},
	];

	// group_two: visible + required by default, hidden when status='published'
	const staticRequiredFields: DeepPartial<Field>[] = [
		{
			field: 'status',
			collection,
			type: 'string',
			name: 'Status',
			meta: { required: false },
			schema: null,
		},
		{
			field: 'group_two',
			collection,
			type: 'alias',
			name: 'Group Two',
			meta: {
				hidden: false,
				required: true,
				special: ['group'],
				conditions: [{ rule: { status: { _eq: 'published' } }, hidden: true }],
			} as any,
			schema: null,
		},
		{
			field: 'f2',
			collection,
			type: 'string',
			name: 'F2',
			meta: { group: 'group_two', required: false },
			schema: null,
		},
	];

	// Bug 1: group_two's condition overrides it to shown+required but the child f2 is not validated
	test('Scenario 1 (Bug 1): validates f2 when group_two is conditionally shown and required', () => {
		const item = { status: 'draft', f1: 'some value', f2: null };
		// Mirror the save flow: pushGroupOptionsDown runs before validateItem
		const processedFields = pushGroupOptionsDown(conditionalFields as Field[]);
		const errors = validateItem(item, processedFields, false);
		const errorFields = errors.map((e) => e.field);
		// group_two becomes shown+required when status='draft'; f2 is null so it must fail validation
		expect(errorFields).toContain('f2');
		// group_one becomes hidden when status='draft'; f1 must not be validated
		expect(errorFields).not.toContain('f1');
	});

	// Bug 2: group_two's static required:true is pushed to f2 by pushGroupOptionsDown,
	// but when the group is hidden by condition, f2 is still validated
	test('Scenario 2 (Bug 2): does not validate f2 when group_two is statically required but conditionally hidden', () => {
		const item = { status: 'published', f2: null };
		// Mirror the save flow: pushGroupOptionsDown pushes required:true onto f2
		const processedFields = pushGroupOptionsDown(staticRequiredFields as Field[]);
		const errors = validateItem(item, processedFields, false);
		const errorFields = errors.map((e) => e.field);
		// group_two is hidden (condition matches status='published'); f2 must not be validated
		expect(errorFields).not.toContain('f2');
	});

	// Regression: group_two is visible and statically required — children should still be validated
	test('Scenario 3 (Regression): validates f2 when group_two is visible and statically required', () => {
		const item = { status: 'draft', f2: null };
		const processedFields = pushGroupOptionsDown(staticRequiredFields as Field[]);
		const errors = validateItem(item, processedFields, false);
		const errorFields = errors.map((e) => e.field);
		// group_two condition does not match (status='draft' != 'published'); group is visible+required
		expect(errorFields).toContain('f2');
	});

	// Regression: group_two is statically hidden — children should never be validated
	test('Scenario 4 (Regression): does not validate f2 when group_two is statically hidden', () => {
		const hiddenGroupFields: DeepPartial<Field>[] = [
			{
				field: 'status',
				collection,
				type: 'string',
				name: 'Status',
				meta: { required: false },
				schema: null,
			},
			{
				field: 'group_two',
				collection,
				type: 'alias',
				name: 'Group Two',
				meta: {
					hidden: true,
					required: false,
					special: ['group'],
				} as any,
				schema: null,
			},
			{
				field: 'f2',
				collection,
				type: 'string',
				name: 'F2',
				meta: { group: 'group_two', required: false },
				schema: null,
			},
		];

		const item = { status: 'published', f2: null };
		const processedFields = pushGroupOptionsDown(hiddenGroupFields as Field[]);
		const errors = validateItem(item, processedFields, false);
		expect(errors.length).toEqual(0);
	});
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
