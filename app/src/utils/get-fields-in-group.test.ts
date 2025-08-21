import { expect, it, describe } from 'vitest';
import { Field } from '@directus/types';
import { getFieldsInGroup } from './get-fields-in-group.js';

describe('getFieldsInGroup', () => {
	const fields: Field[] = [
		{
			field: 'group1',
			type: 'alias',
			collection: 'test',
			meta: {
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1',
		},
		{
			field: 'field_in_group1',
			type: 'string',
			collection: 'test',
			meta: {
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
				special: ['group'],
			} as any,
			schema: null,
			name: 'Group 1 1',
		},
		{
			field: 'field_in_group1_1',
			type: 'string',
			collection: 'test',
			meta: {
				group: 'group1_1',
			} as any,
			schema: null,
			name: 'Field in group 1 1',
		},
		{
			field: 'root_field',
			type: 'string',
			collection: 'test',
			meta: {} as any,
			schema: null,
			name: 'Root field',
		},
		{
			field: 'no_meta_field',
			type: 'string',
			collection: 'test',
			meta: null as any,
			schema: null,
			name: 'No Meta Field',
		},
	];

	it('should return root fields when group is null', () => {
		const result = getFieldsInGroup(null, fields);
		expect(result).toHaveLength(1); // Only fields with no meta object (no_meta_field)
		expect(result.map((f) => f.field)).toContain('no_meta_field');
	});

	it('should return fields in a specific group', () => {
		const result = getFieldsInGroup('group1', fields);
		expect(result).toHaveLength(3); // field_in_group1, group1_1, and field_in_group1_1 (nested)
		expect(result.map((f) => f.field)).toContain('field_in_group1');
		expect(result.map((f) => f.field)).toContain('group1_1');
		expect(result.map((f) => f.field)).toContain('field_in_group1_1');
	});

	it('should return fields in nested groups', () => {
		const result = getFieldsInGroup('group1_1', fields);
		expect(result).toHaveLength(1);
		expect(result[0]?.field).toBe('field_in_group1_1');
	});

	it('should handle circular references', () => {
		const fieldsWithCircular: Field[] = [
			{
				field: 'group_a',
				type: 'alias',
				collection: 'test',
				meta: {
					special: ['group'],
				} as any,
				schema: null,
				name: 'Group A',
			},
			{
				field: 'group_b',
				type: 'alias',
				collection: 'test',
				meta: {
					group: 'group_a',
					special: ['group'],
				} as any,
				schema: null,
				name: 'Group B',
			},
			{
				field: 'group_c',
				type: 'alias',
				collection: 'test',
				meta: {
					group: 'group_b',
					special: ['group'],
				} as any,
				schema: null,
				name: 'Group C',
			},
		];

		const result = getFieldsInGroup('group_a', fieldsWithCircular);
		expect(result).toHaveLength(2); // group_b and group_c (nested)
		expect(result.map((f) => f.field)).toContain('group_b');
		expect(result.map((f) => f.field)).toContain('group_c');
	});

	it('should return empty array for non-existent group', () => {
		const result = getFieldsInGroup('non_existent', fields);
		expect(result).toHaveLength(0);
	});
});
