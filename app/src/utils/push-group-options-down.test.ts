import { pushGroupOptionsDown } from './push-group-options-down.js';
import { Field } from '@directus/types';
import { describe, expect, it, test } from 'vitest';

describe('basic', () => {
	const fields: Field[] = [
		{
			field: 'group1',
			type: 'alias',
			collection: 'test',
			meta: {
				required: true,
				readonly: true,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1',
		},
		{
			field: 'field_in_group1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: false,
				group: 'group1',
			} as any,
			schema: null,
			name: 'Field in group 1',
		},
	];

	it('should push options', () => {
		expect(pushGroupOptionsDown(fields)).toEqual([
			{
				field: 'group1',
				type: 'alias',
				collection: 'test',
				meta: {
					required: false,
					readonly: false,
					special: ['group'],
				},
				schema: null,
				name: 'Group 1',
			},
			{
				field: 'field_in_group1',
				type: 'boolean',
				collection: 'test',
				meta: {
					required: true,
					readonly: true,
					group: 'group1',
				},
				schema: null,
				name: 'Field in group 1',
			},
		]);
	});

	it('should not mutate', () => {
		expect(pushGroupOptionsDown(fields)).not.toBe(fields);
	});
});

test('with < 2 fields', () => {
	const fields: Field[] = [
		{
			field: 'group1',
			type: 'alias',
			collection: 'test',
			meta: {
				required: true,
				readonly: true,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1',
		},
	];

	expect(pushGroupOptionsDown(fields)).toBe(fields);
});

test('with nested groups', () => {
	const fields: Field[] = [
		{
			field: 'group1',
			type: 'alias',
			collection: 'test',
			meta: {
				required: true,
				readonly: false,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1',
		},
		{
			field: 'field_in_group1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: false,
				readonly: false,
				group: 'group1',
			} as any,
			schema: null,
			name: 'Field in group 1',
		},
		{
			field: 'group1_1',
			type: 'alias',
			collection: 'test',
			meta: {
				group: 'group1',
				required: false,
				readonly: true,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1 1',
		},
		{
			field: 'field_in_group1_1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: false,
				readonly: false,
				group: 'group1_1',
			} as any,
			schema: null,
			name: 'Field in group 1 1',
		},
	];

	expect(pushGroupOptionsDown(fields)).toEqual([
		{
			field: 'group1',
			type: 'alias',
			collection: 'test',
			meta: {
				required: false,
				readonly: false,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1',
		},
		{
			field: 'field_in_group1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: true,
				readonly: false,
				group: 'group1',
			} as any,
			schema: null,
			name: 'Field in group 1',
		},
		{
			field: 'group1_1',
			type: 'alias',
			collection: 'test',
			meta: {
				group: 'group1',
				required: false,
				readonly: false,
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1 1',
		},
		{
			field: 'field_in_group1_1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: true,
				readonly: true,
				group: 'group1_1',
			} as any,
			schema: null,
			name: 'Field in group 1 1',
		},
	]);
});

// Happens when accordion / detail fields are starting closed & are then opened
// (only sub fields are passed to pushGroupOptionsDown)
test('with missing referenced groups', () => {
	const fields: Field[] = [
		{
			field: 'field_in_group1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: true,
				readonly: false,
				group: 'group1',
			} as any,
			schema: null,
			name: 'Field in group 1',
		},
		{
			field: 'field_in_group1_1',
			type: 'boolean',
			collection: 'test',
			meta: {
				required: true,
				readonly: true,
				group: 'group1_1',
			} as any,
			schema: null,
			name: 'Field in group 1 1',
		},
	];

	expect(pushGroupOptionsDown(fields)).toEqual(fields);
});
