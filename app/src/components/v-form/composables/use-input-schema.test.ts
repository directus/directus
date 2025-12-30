import { useInputSchema } from './use-input-schema';
import type { DeepPartial, Field } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';


// Minimal field factory using DeepPartial to keep fixtures concise
const makeField = (overrides: DeepPartial<Field> = {}): DeepPartial<Field> => ({
	field: 'test',
	type: 'string',
	meta: {},
	...overrides,
});

describe('useInputSchema', () => {
	it('should create a schema for a string field', () => {
		const fields = [makeField()];

		const { inputSchema } = useInputSchema(fields as unknown as Field[]);
		const schema = inputSchema.value;
		expect(schema.shape.test).toBeDefined();
		expect(() => schema.parse({ test: 'hello' })).not.toThrow();
		expect(() => schema.parse({ test: 123 })).toThrow();
	});

	it('should skip readonly fields', () => {
		const fields = [makeField({ meta: { readonly: true } })];

		const { inputSchema } = useInputSchema(fields as unknown as Field[]);
		const schema = inputSchema.value;
		expect(schema.shape.test).toBeUndefined();
	});

	it('should create enum for choices', () => {
		const fields = [
			makeField({
				meta: {
					options: {
						choices: [{ value: 'A' }, { value: 'B' }],
					},
				},
			}),
		];

		const { inputSchema } = useInputSchema(fields as unknown as Field[]);
		const schema = inputSchema.value;
		expect(() => schema.parse({ test: 'A' })).not.toThrow();
		expect(() => schema.parse({ test: 'B' })).not.toThrow();
		expect(() => schema.parse({ test: 'C' })).toThrow();
	});

	it('should handle multiple field types', () => {
		const fields = [
			makeField({ field: 'str', type: 'string' }),
			makeField({ field: 'bool', type: 'boolean' }),
			makeField({ field: 'int', type: 'integer' }),
			makeField({ field: 'date', type: 'date' }),
		];

		const { inputSchema } = useInputSchema(fields as unknown as Field[]);
		const schema = inputSchema.value;
		expect(() => schema.parse({ str: 'abc', bool: true, int: 42, date: '2020-01-01' })).not.toThrow();
		expect(() => schema.parse({ str: 1 })).toThrow();
		expect(() => schema.parse({ bool: 'true' })).toThrow();
		expect(() => schema.parse({ int: '42' })).toThrow();
		expect(() => schema.parse({ date: new Date() })).toThrow();
	});

	it('should accept missing optional fields', () => {
		const fields = [makeField()];

		const { inputSchema } = useInputSchema(fields as unknown as Field[]);
		const schema = inputSchema.value;
		expect(() => schema.parse({})).not.toThrow();
	});

	it('should work with ref input', () => {
		const fields = ref([makeField()]);

		const { inputSchema } = useInputSchema(fields as unknown as any);
		const schema = inputSchema.value;
		expect(() => schema.parse({ test: 'hello' })).not.toThrow();
	});
});
