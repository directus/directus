import { FieldNode } from '../../src/composables/use-field-tree';
import { flattenFieldGroups } from '../../src/utils/flatten-field-groups';
import { describe, expect, it } from 'vitest';

describe('utils/flatten-field-groups', () => {
	it('Returns the original tree when no groups are present', () => {
		const TreeWithoutGroups: FieldNode[] = [
			{ name: 'ID', field: 'id', collection: 'test', key: 'id', path: 'id', type: 'integer' },
			{ name: 'Test Field', field: 'test', collection: 'test', key: 'test', path: 'test', type: 'string' },
		];

		expect(flattenFieldGroups(TreeWithoutGroups)).toEqual(TreeWithoutGroups);
	});

	it('Returns a tree without groups', () => {
		const TreeWithGroups: FieldNode[] = [
			{ name: 'ID', field: 'id', collection: 'test', key: 'id', path: 'id', type: 'integer' },
			{
				name: 'Group',
				field: 'group',
				collection: 'test',
				key: '',
				path: 'group',
				group: true,
				type: 'alias',
				children: [
					{
						name: 'Nested Field',
						field: 'nested_field',
						collection: 'test',
						key: 'nested_field',
						path: 'group.nested_field',
						type: 'string',
					},
				],
			},
		];

		const TreeWithoutGroups: FieldNode[] = [
			{ name: 'ID', field: 'id', collection: 'test', key: 'id', path: 'id', type: 'integer' },
			{
				name: 'Nested Field',
				field: 'nested_field',
				collection: 'test',
				key: 'nested_field',
				path: 'group.nested_field',
				type: 'string',
			},
		];

		expect(flattenFieldGroups(TreeWithGroups)).toEqual(TreeWithoutGroups);
	});

	it('Returns a tree without deeply nested groups', () => {
		const TreeWithNestedGroups: FieldNode[] = [
			{ name: 'ID', field: 'id', collection: 'test', key: 'id', path: 'id', type: 'integer' },
			{
				name: 'Group',
				field: 'group1',
				collection: 'test',
				key: '',
				path: 'group1',
				group: true,
				type: 'alias',
				children: [
					{
						name: 'Group',
						field: 'group2',
						collection: 'test',
						key: '',
						path: 'group2',
						group: true,
						type: 'alias',
						children: [
							{
								name: 'Nested Field 1',
								field: 'nested_field_1',
								collection: 'test',
								key: 'nested_field',
								path: 'group.nested_field_1',
								type: 'string',
							},
							{
								name: 'Group',
								field: 'group3',
								collection: 'test',
								key: '',
								path: 'group3',
								group: true,
								type: 'alias',
								children: [
									{
										name: 'Nested Field 2',
										field: 'nested_field_2',
										collection: 'test',
										key: 'nested_field',
										path: 'group.nested_field_2',
										type: 'string',
									},
								],
							},
						],
					},
				],
			},
		];

		const TreeWithoutGroups: FieldNode[] = [
			{ name: 'ID', field: 'id', collection: 'test', key: 'id', path: 'id', type: 'integer' },
			{
				name: 'Nested Field 1',
				field: 'nested_field_1',
				collection: 'test',
				key: 'nested_field',
				path: 'group.nested_field_1',
				type: 'string',
			},
			{
				name: 'Nested Field 2',
				field: 'nested_field_2',
				collection: 'test',
				key: 'nested_field',
				path: 'group.nested_field_2',
				type: 'string',
			},
		];

		expect(flattenFieldGroups(TreeWithNestedGroups)).toEqual(TreeWithoutGroups);
	});
});
