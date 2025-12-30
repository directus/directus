import config from './index';
import type { ExtensionOptionsContext } from '@directus/extensions';
import { describe, expect, test } from 'vitest';

type OptionsFunction = (context: Partial<ExtensionOptionsContext>) => unknown;

describe('input interface options', () => {
	describe('numeric field types', () => {
		test('returns float type for min/max/step when field is float', () => {
			const field = {
				type: 'float' as const,
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(Array.isArray(options)).toBe(true);

			const stepOption = (options as any[]).find((opt) => opt.field === 'step');
			expect(stepOption).toBeDefined();
			expect(stepOption.type).toBe('float');

			const minOption = (options as any[]).find((opt) => opt.field === 'min');
			expect(minOption).toBeDefined();
			expect(minOption.type).toBe('float');

			const maxOption = (options as any[]).find((opt) => opt.field === 'max');
			expect(maxOption).toBeDefined();
			expect(maxOption.type).toBe('float');
		});

		test('returns integer type for min/max/step when field is integer', () => {
			const field = {
				type: 'integer' as const,
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(Array.isArray(options)).toBe(true);

			const stepOption = (options as any[]).find((opt) => opt.field === 'step');
			expect(stepOption).toBeDefined();
			expect(stepOption.type).toBe('integer');

			const minOption = (options as any[]).find((opt) => opt.field === 'min');
			expect(minOption).toBeDefined();
			expect(minOption.type).toBe('integer');

			const maxOption = (options as any[]).find((opt) => opt.field === 'max');
			expect(maxOption).toBeDefined();
			expect(maxOption.type).toBe('integer');
		});

		test('has default step value of 1 for numeric types', () => {
			const floatField = {
				type: 'float' as const,
			};

			const integerField = {
				type: 'integer' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const floatOptions = (config.options as OptionsFunction)({ field: floatField });
			const integerOptions = (config.options as OptionsFunction)({ field: integerField });

			expect(floatOptions).toBeDefined();
			expect(integerOptions).toBeDefined();

			const floatStepOption = (floatOptions as any[]).find((opt) => opt.field === 'step');
			const integerStepOption = (integerOptions as any[]).find((opt) => opt.field === 'step');

			expect(floatStepOption.schema.default_value).toBe(1);
			expect(integerStepOption.schema.default_value).toBe(1);
		});
	});

	describe('text field types', () => {
		test('returns textOptions for string field', () => {
			const field = {
				type: 'string' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(options).toHaveProperty('standard');
			expect(options).toHaveProperty('advanced');
		});

		test('returns textOptions for text field', () => {
			const field = {
				type: 'text' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(options).toHaveProperty('standard');
			expect(options).toHaveProperty('advanced');
		});

		test('returns textOptions for uuid field', () => {
			const field = {
				type: 'uuid' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(options).toHaveProperty('standard');
			expect(options).toHaveProperty('advanced');
		});

		test('returns textOptions for decimal field', () => {
			const field = {
				type: 'decimal' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(options).toHaveProperty('standard');
			expect(options).toHaveProperty('advanced');
		});

		test('returns textOptions for bigInteger field', () => {
			const field = {
				type: 'bigInteger' as const,
				field: 'test',
			};

			expect(typeof config.options).toBe('function');
			const options = (config.options as OptionsFunction)({ field });

			expect(options).toBeDefined();
			expect(options).toHaveProperty('standard');
			expect(options).toHaveProperty('advanced');
		});
	});
});
