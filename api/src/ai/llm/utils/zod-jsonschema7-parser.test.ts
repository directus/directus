import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseJsonSchema7 } from './parse-json-schema-7.js';
import { zodJsonSchema7Parser } from './zod-jsonschema7-parser.js';

vi.mock('./parse-json-schema-7.js', () => ({
	parseJsonSchema7: vi.fn(),
}));

describe('zodJsonSchema7Parser', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('valid schemas', () => {
		it('should return true for valid basic JSONSchema7', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					age: { type: 'number' },
				},
				required: ['name'],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
			expect(vi.mocked(parseJsonSchema7)).toHaveBeenCalledWith(schema);
		});

		it('should return true for simple string schema', () => {
			const schema = { type: 'string' };

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should return true for simple number schema', () => {
			const schema = { type: 'number' };

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should return true for schema with nested objects', () => {
			const schema = {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							email: { type: 'string' },
						},
						required: ['name', 'email'],
					},
				},
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should return true for schema with arrays', () => {
			const schema = {
				type: 'object',
				properties: {
					items: {
						type: 'array',
						items: { type: 'string' },
					},
				},
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should return true for schema with allOf', () => {
			const schema = {
				allOf: [
					{ type: 'object', properties: { name: { type: 'string' } } },
					{ type: 'object', properties: { age: { type: 'number' } } },
				],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should return true for schema with enum', () => {
			const schema = {
				type: 'string',
				enum: ['red', 'green', 'blue'],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});
	});

	describe('invalid schemas', () => {
		it('should return false when parseJsonSchema7 throws an error', () => {
			const schema = { invalid: 'schema' };

			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid schema');
			});

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(false);
		});

		it('should return false for null', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid');
			});

			const result = zodJsonSchema7Parser(null);

			expect(result).toBe(false);
		});

		it('should return false for undefined', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid');
			});

			const result = zodJsonSchema7Parser(undefined);

			expect(result).toBe(false);
		});

		it('should return false for empty object', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid');
			});

			const result = zodJsonSchema7Parser({});

			expect(result).toBe(false);
		});

		it('should return false for malformed schema', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'invalid-type' },
				},
			};

			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid type: invalid-type');
			});

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(false);
		});

		it('should return false when parseJsonSchema7 throws TypeError', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new TypeError('Cannot read property of undefined');
			});

			const result = zodJsonSchema7Parser({ broken: 'schema' });

			expect(result).toBe(false);
		});

		it('should return false for string input', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid');
			});

			const result = zodJsonSchema7Parser('not-a-schema');

			expect(result).toBe(false);
		});

		it('should return false for number input', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new Error('Invalid');
			});

			const result = zodJsonSchema7Parser(42);

			expect(result).toBe(false);
		});
	});

	describe('type guard behavior', () => {
		it('should call parseJsonSchema7 exactly once per invocation', () => {
			const schema = { type: 'string' };

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			zodJsonSchema7Parser(schema);

			expect(vi.mocked(parseJsonSchema7)).toHaveBeenCalledTimes(1);
		});

		it('should pass the schema parameter directly to parseJsonSchema7', () => {
			const schema = {
				type: 'object',
				properties: { test: { type: 'boolean' } },
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			zodJsonSchema7Parser(schema);

			expect(vi.mocked(parseJsonSchema7)).toHaveBeenCalledWith(schema);
		});

		it('should handle any thrown error type', () => {
			class CustomError extends Error {
				constructor() {
					super('Custom error');
				}
			}

			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new CustomError();
			});

			const result = zodJsonSchema7Parser({ test: 'schema' });

			expect(result).toBe(false);
		});

		it('should catch SyntaxError from parseJsonSchema7', () => {
			vi.mocked(parseJsonSchema7).mockImplementation(() => {
				throw new SyntaxError('Invalid JSON');
			});

			const result = zodJsonSchema7Parser({ test: 'schema' });

			expect(result).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle deeply nested schemas', () => {
			const schema = {
				type: 'object',
				properties: {
					level1: {
						type: 'object',
						properties: {
							level2: {
								type: 'object',
								properties: {
									level3: {
										type: 'object',
										properties: {
											value: { type: 'string' },
										},
									},
								},
							},
						},
					},
				},
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should handle schema with multiple required fields', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
					age: { type: 'number' },
					active: { type: 'boolean' },
				},
				required: ['name', 'email', 'age', 'active'],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should handle schema with additional properties', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
				additionalProperties: false,
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should handle schema with oneOf', () => {
			const schema = {
				oneOf: [{ type: 'string' }, { type: 'number' }],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});

		it('should handle schema with anyOf', () => {
			const schema = {
				anyOf: [
					{ type: 'object', properties: { type: { const: 'A' } } },
					{ type: 'object', properties: { type: { const: 'B' } } },
				],
			};

			vi.mocked(parseJsonSchema7).mockReturnValue({} as any);

			const result = zodJsonSchema7Parser(schema);

			expect(result).toBe(true);
		});
	});
});
