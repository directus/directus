import { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHiddenFieldsByCondition, shouldClearField } from './clear-hidden-fields-by-condition.js';

function makeField(fieldName: string, overrides: Partial<Field> = {}): Field {
	return {
		collection: 'test',
		field: fieldName,
		name: fieldName,
		type: 'string',
		schema: null,
		meta: {
			id: 1,
			collection: 'test',
			field: fieldName,
			special: null,
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 1,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
		...overrides,
	} as Field;
}

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));
});

describe('shouldClearField', () => {
	it('returns false when field has no conditions', () => {
		const field = makeField('title');
		expect(shouldClearField(field, {})).toBe(false);
	});

	it('returns false when no condition matches', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'hide when published',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		expect(shouldClearField(field, { status: 'draft' })).toBe(false);
	});

	it('returns false when condition matches but hidden is false', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'not hidden when published',
						rule: { status: { _eq: 'published' } },
						hidden: false,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		expect(shouldClearField(field, { status: 'published' })).toBe(false);
	});

	it('returns false when condition matches, hidden is true, but clear_hidden_value_on_save is false', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'hide but keep value',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: false,
					},
				],
			},
		});

		expect(shouldClearField(field, { status: 'published' })).toBe(false);
	});

	it('returns true when condition matches and both hidden and clear_hidden_value_on_save are true', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'hide and clear when published',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		expect(shouldClearField(field, { status: 'published' })).toBe(true);
	});
});

describe('clearHiddenFieldsByCondition', () => {
	it('returns original edits reference when no fields need clearing', () => {
		const field = makeField('title');
		const edits = { title: 'hello' };
		const result = clearHiddenFieldsByCondition(edits, [field], {}, {});
		expect(result).toBe(edits);
	});

	it('clears a field to null when schema has no default_value', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'clear title',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		const edits = { title: 'some value', status: 'published' };
		const result = clearHiddenFieldsByCondition(edits, [field], {}, {});
		expect(result.title).toBeNull();
	});

	it('clears a field to its schema default_value', () => {
		const field = makeField('score', {
			schema: {
				name: 'score',
				table: 'test',
				data_type: 'integer',
				default_value: 0,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: true,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: null,
				foreign_key_table: null,
			},
			meta: {
				...makeField('score').meta!,
				conditions: [
					{
						name: 'clear score',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		const edits = { score: 42, status: 'published' };
		const result = clearHiddenFieldsByCondition(edits, [field], {}, {});
		expect(result.score).toBe(0);
	});

	it('does not mutate the original edits', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'clear title',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		const edits = { title: 'original', status: 'published' };
		const result = clearHiddenFieldsByCondition(edits, [field], {}, {});
		expect(edits.title).toBe('original');
		expect(result.title).toBeNull();
	});

	it('evaluates conditions against merged values from defaults, item, and edits', () => {
		const field = makeField('title', {
			meta: {
				...makeField('title').meta!,
				conditions: [
					{
						name: 'clear when archived',
						rule: { status: { _eq: 'archived' } },
						hidden: true,
						readonly: false,
						options: undefined,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		// status comes from existing item, not edits
		const edits = { title: 'some value' };
		const defaults = {};
		const item = { status: 'archived' };
		const result = clearHiddenFieldsByCondition(edits, [field], defaults, item);
		expect(result.title).toBeNull();
	});

	it('clears all fields within a hidden group', () => {
		const groupField = makeField('my_group', {
			type: 'alias',
			schema: null,
			meta: {
				...makeField('my_group').meta!,
				special: ['alias', 'no-data', 'group'],
				conditions: [
					{
						name: 'hide group',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		const childField1 = makeField('child_one', {
			meta: { ...makeField('child_one').meta!, group: 'my_group' },
		});

		const childField2 = makeField('child_two', {
			meta: { ...makeField('child_two').meta!, group: 'my_group' },
		});

		const edits = { child_one: 'value1', child_two: 'value2', status: 'published' };
		const result = clearHiddenFieldsByCondition(edits, [groupField, childField1, childField2], {}, {});
		expect(result.child_one).toBeNull();
		expect(result.child_two).toBeNull();
	});

	it('does not clear fields in a group when its condition does not match', () => {
		const groupField = makeField('my_group', {
			type: 'alias',
			schema: null,
			meta: {
				...makeField('my_group').meta!,
				special: ['alias', 'no-data', 'group'],
				conditions: [
					{
						name: 'hide group',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						readonly: false,
						options: null,
						required: false,
						clear_hidden_value_on_save: true,
					},
				],
			},
		});

		const childField = makeField('child_one', {
			meta: { ...makeField('child_one').meta!, group: 'my_group' },
		});

		const edits = { child_one: 'value1', status: 'draft' };
		const result = clearHiddenFieldsByCondition(edits, [groupField, childField], {}, {});
		expect(result).toBe(edits);
	});
});
