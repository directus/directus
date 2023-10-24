import { expect, it, test } from 'vitest';

import { Field } from '@directus/types';
import { pushGroupOptionsDown } from './push-group-options-down.js';

test('pushGroupOptionsDown', () => {
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

test('pushGroupOptionsDown with nested groups', () => {
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

// This happens e.g. when fields are nested in a accordion
test('pushGroupOptionsDown with single field', () => {
	const fields: Field[] = [
		{
			collection: 'test',
			field: 'detail',
			type: 'alias',
			schema: null,
			meta: {
				special: ['alias', 'no-data', 'group'],
				interface: 'group-detail',
				readonly: false,
				required: false,
				group: 'accordion-3ml8h4',
			} as any,
			name: 'Detail',
		},
	];

	expect(pushGroupOptionsDown(fields)).toEqual(fields);
});
