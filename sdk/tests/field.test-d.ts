import { assertType, describe, expectTypeOf, test } from 'vitest';
import type { DirectusField, FieldMetaConditionRule, FieldMetaConditionType } from '../src/schema/field.js';
import type { TestSchema } from './schema.js';

describe('DirectusField', () => {
	test('schema is nullable', () => {
		expectTypeOf<DirectusField<TestSchema>['schema']>().toBeNullable();
	});

	test('meta.system is optional and only ever true', () => {
		type Meta = NonNullable<DirectusField<TestSchema>['meta']>;

		expectTypeOf<Meta['system']>().toEqualTypeOf<true | undefined>();
	});
});

describe('FieldMetaConditionType', () => {
	test('only name and rule are required', () => {
		assertType<FieldMetaConditionType>({
			name: 'my-condition',
			rule: { status: { _eq: 'published' } },
		});

		assertType<FieldMetaConditionType>({
			name: 'my-condition',
			hidden: true,
			readonly: false,
			required: true,
			clear_hidden_value_on_save: true,
			options: { placeholder: 'Enter a value' },
			rule: { status: { _eq: 'published' } },
		});
	});

	test('missing required properties are rejected', () => {
		// @ts-expect-error
		assertType<FieldMetaConditionType>({ name: 'my-condition' });

		// @ts-expect-error
		assertType<FieldMetaConditionType>({ rule: { status: { _eq: 'published' } } });
	});
});

describe('FieldMetaConditionRule', () => {
	test('accepts nesting via _and/_or', () => {
		assertType<FieldMetaConditionRule>({
			_and: [{ status: { _eq: 'published' } }, { title: { _nnull: true } }],
		});

		assertType<FieldMetaConditionRule>({
			_or: [{ status: { _eq: 'published' } }, { status: { _eq: 'archived' } }],
		});
	});

	test('rejects operator names that are not real filter operators', () => {
		assertType<FieldMetaConditionRule>({
			// @ts-expect-error
			status: { _not_a_real_operator: 'published' },
		});
	});
});
