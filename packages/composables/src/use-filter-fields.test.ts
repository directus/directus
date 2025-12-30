/**
 * @vitest-environment jsdom
 */
import { useFilterFields } from './use-filter-fields.js';
import type { Field } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

// Mock field data for testing
const createMockField = (overrides: Partial<Field> = {}): Field => ({
	collection: 'test_collection',
	field: 'test_field',
	name: 'test_field',
	type: 'string',
	schema: {
		name: 'test_field',
		table: 'test_collection',
		data_type: 'varchar',
		default_value: null,
		max_length: null,
		numeric_precision: null,
		numeric_scale: null,
		is_nullable: true,
		is_unique: false,
		is_primary_key: false,
		has_auto_increment: false,
		foreign_key_column: null,
		foreign_key_table: null,
		comment: null,
		is_indexed: false,
		is_generated: false,
	},
	meta: {
		id: 1,
		collection: 'test_collection',
		field: 'test_field',
		special: null,
		interface: null,
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: null,
		width: 'full',
		translations: null,
		note: null,
		conditions: null,
		required: false,
		group: null,
		validation: null,
		validation_message: null,
		searchable: true,
	},
	...overrides,
});

describe('useFilterFields', () => {
	it('should initialize with empty arrays for each filter group', () => {
		const fields = ref<Field[]>([]);

		const filters = {
			required: (field: Field) => field.meta?.required === true,
			optional: (field: Field) => field.meta?.required !== true,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.required).toEqual([]);
		expect(fieldGroups.value.optional).toEqual([]);
	});

	it('should filter fields into correct groups based on single criteria', () => {
		const fields = ref<Field[]>([
			createMockField({ field: 'id', meta: { ...createMockField().meta!, required: true } }),
			createMockField({ field: 'name', meta: { ...createMockField().meta!, required: true } }),
			createMockField({ field: 'description', meta: { ...createMockField().meta!, required: false } }),
		]);

		const filters = {
			required: (field: Field) => field.meta?.required === true,
			optional: (field: Field) => field.meta?.required === false,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.required).toHaveLength(2);
		expect(fieldGroups.value.required.map((f) => f.field)).toEqual(['id', 'name']);
		expect(fieldGroups.value.optional).toHaveLength(1);
		expect(fieldGroups.value.optional[0]!.field).toBe('description');
	});

	it('should handle fields that match multiple filters', () => {
		const fields = ref<Field[]>([
			createMockField({
				field: 'id',
				type: 'integer',
				meta: { ...createMockField().meta!, required: true },
			}),
			createMockField({
				field: 'title',
				type: 'string',
				meta: { ...createMockField().meta!, required: true },
			}),
			createMockField({
				field: 'count',
				type: 'integer',
				meta: { ...createMockField().meta!, required: false },
			}),
		]);

		const filters = {
			required: (field: Field) => field.meta?.required === true,
			numeric: (field: Field) => ['integer', 'float', 'decimal'].includes(field.type),
			text: (field: Field) => ['string', 'text'].includes(field.type),
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		// id should be in both required and numeric
		expect(fieldGroups.value.required).toHaveLength(2);
		expect(fieldGroups.value.numeric).toHaveLength(2);
		expect(fieldGroups.value.text).toHaveLength(1);

		expect(fieldGroups.value.required.map((f) => f.field)).toEqual(['id', 'title']);
		expect(fieldGroups.value.numeric.map((f) => f.field)).toEqual(['id', 'count']);
		expect(fieldGroups.value.text.map((f) => f.field)).toEqual(['title']);
	});

	it('should handle fields that match no filters', () => {
		const fields = ref<Field[]>([
			createMockField({ field: 'id', type: 'integer' }),
			createMockField({ field: 'unknown', type: 'text' }),
		]);

		const filters = {
			text: (field: Field) => field.type === 'string',
			boolean: (field: Field) => field.type === 'boolean',
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.text).toEqual([]);
		expect(fieldGroups.value.boolean).toEqual([]);
	});

	it('should be reactive to changes in fields', () => {
		const fields = ref<Field[]>([createMockField({ field: 'id', type: 'integer' })]);

		const filters = {
			numeric: (field: Field) => ['integer', 'float', 'decimal'].includes(field.type),
			text: (field: Field) => field.type === 'string',
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		// Initially
		expect(fieldGroups.value.numeric).toHaveLength(1);
		expect(fieldGroups.value.text).toHaveLength(0);

		// Add a text field
		fields.value.push(createMockField({ field: 'name', type: 'string' }));

		expect(fieldGroups.value.numeric).toHaveLength(1);
		expect(fieldGroups.value.text).toHaveLength(1);
		expect(fieldGroups.value.text[0]!.field).toBe('name');

		// Remove the integer field
		fields.value = fields.value.filter((f) => f.type !== 'integer');

		expect(fieldGroups.value.numeric).toHaveLength(0);
		expect(fieldGroups.value.text).toHaveLength(1);
	});

	it('should handle complex filter logic', () => {
		const fields = ref<Field[]>([
			createMockField({
				field: 'id',
				type: 'integer',
				meta: { ...createMockField().meta!, required: true, hidden: false },
			}),
			createMockField({
				field: 'secret',
				type: 'string',
				meta: { ...createMockField().meta!, required: false, hidden: true },
			}),
			createMockField({
				field: 'name',
				type: 'string',
				meta: { ...createMockField().meta!, required: true, hidden: false },
			}),
		]);

		const filters = {
			visible: (field: Field) => field.meta?.hidden !== true,
			requiredAndVisible: (field: Field) => field.meta?.required === true && field.meta?.hidden !== true,
			hiddenOrOptional: (field: Field) => field.meta?.hidden === true || field.meta?.required === false,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.visible.map((f) => f.field)).toEqual(['id', 'name']);
		expect(fieldGroups.value.requiredAndVisible.map((f) => f.field)).toEqual(['id', 'name']);
		expect(fieldGroups.value.hiddenOrOptional.map((f) => f.field)).toEqual(['secret']);
	});

	it('should handle empty filter object', () => {
		const fields = ref<Field[]>([createMockField({ field: 'id' }), createMockField({ field: 'name' })]);

		const filters = {};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value).toEqual({});
	});

	it('should handle filters that always return false', () => {
		const fields = ref<Field[]>([createMockField({ field: 'id' }), createMockField({ field: 'name' })]);

		const filters = {
			never: () => false,
			alsoNever: () => false,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.never).toEqual([]);
		expect(fieldGroups.value.alsoNever).toEqual([]);
	});

	it('should handle filters that always return true', () => {
		const fields = ref<Field[]>([createMockField({ field: 'id' }), createMockField({ field: 'name' })]);

		const filters = {
			all: () => true,
			everything: () => true,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.all).toHaveLength(2);
		expect(fieldGroups.value.everything).toHaveLength(2);
		expect(fieldGroups.value.all.map((f) => f.field)).toEqual(['id', 'name']);
		expect(fieldGroups.value.everything.map((f) => f.field)).toEqual(['id', 'name']);
	});

	it('should maintain correct order of fields in groups', () => {
		const fields = ref<Field[]>([
			createMockField({ field: 'z_field', type: 'string' }),
			createMockField({ field: 'a_field', type: 'string' }),
			createMockField({ field: 'm_field', type: 'string' }),
		]);

		const filters = {
			text: (field: Field) => field.type === 'string',
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		// Should maintain the original order from the fields array
		expect(fieldGroups.value.text.map((f) => f.field)).toEqual(['z_field', 'a_field', 'm_field']);
	});

	it('should handle different field types correctly', () => {
		const fields = ref<Field[]>([
			createMockField({ field: 'text_field', type: 'string' }),
			createMockField({ field: 'number_field', type: 'integer' }),
			createMockField({ field: 'bool_field', type: 'boolean' }),
			createMockField({ field: 'date_field', type: 'dateTime' }),
			createMockField({ field: 'json_field', type: 'json' }),
		]);

		const filters = {
			primitive: (field: Field) => ['string', 'integer', 'boolean'].includes(field.type),
			complex: (field: Field) => ['json', 'dateTime'].includes(field.type),
			textLike: (field: Field) => ['string', 'text', 'json'].includes(field.type),
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.primitive.map((f) => f.field)).toEqual(['text_field', 'number_field', 'bool_field']);

		expect(fieldGroups.value.complex.map((f) => f.field)).toEqual(['date_field', 'json_field']);

		expect(fieldGroups.value.textLike.map((f) => f.field)).toEqual(['text_field', 'json_field']);
	});

	it('should work with single filter', () => {
		const fields = ref<Field[]>([
			createMockField({ field: 'field1', type: 'string' }),
			createMockField({ field: 'field2', type: 'integer' }),
		]);

		const filters = {
			onlyStrings: (field: Field) => field.type === 'string',
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.onlyStrings).toHaveLength(1);
		expect(fieldGroups.value.onlyStrings[0]!.field).toBe('field1');
	});

	it('should handle filter functions that access nested properties safely', () => {
		const fields = ref<Field[]>([
			createMockField({
				field: 'normal_field',
				meta: { ...createMockField().meta!, options: { placeholder: 'Enter text' } },
			}),
			createMockField({
				field: 'no_options_field',
				meta: { ...createMockField().meta!, options: null },
			}),
			// Field with missing meta
			{ ...createMockField({ field: 'minimal_field' }), meta: null } as Field,
		]);

		const filters = {
			hasPlaceholder: (field: Field) => field.meta?.options?.['placeholder'] != null,
			hasOptions: (field: Field) => field.meta?.options != null,
			hasMeta: (field: Field) => field.meta != null,
		};

		const { fieldGroups } = useFilterFields(fields, filters);

		expect(fieldGroups.value.hasPlaceholder.map((f) => f.field)).toEqual(['normal_field']);
		expect(fieldGroups.value.hasOptions.map((f) => f.field)).toEqual(['normal_field']);
		expect(fieldGroups.value.hasMeta.map((f) => f.field)).toEqual(['normal_field', 'no_options_field']);
	});
});
