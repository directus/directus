import { test, expect, vi, beforeEach } from 'vitest';
import { createI18n } from 'vue-i18n';
import { formatValidationRule, parseValidationStructure, type ValidationNode } from './format-validation-structure';

vi.mock('@/lang', () => {
	const i18n = createI18n({
		legacy: false,
		locale: 'en-US',
		messages: {
			'en-US': {
				validationError: {
					contains: 'Value has to contain {substring}',
					eq: 'Value has to be {valid}',
					neq: "Value can't be {invalid}",
				},
				validation_value_is_invalid: 'Value is invalid',
			},
		},
	});

	return {
		i18n,
	};
});

beforeEach(() => {
	vi.clearAllMocks();
});

test('formatValidationRule returns fallback message for unsupported operator', () => {
	const mockT = vi.fn((key: string, _params?: any) => {
		if (key === 'validation_value_is_invalid') {
			return 'Value is invalid';
		}

		return key;
	});

	const node: ValidationNode = {
		type: 'rule',
		field: 'test_field',
		operator: 'unknown_operator',
		value: 'test_value',
	};

	const result = formatValidationRule(node, mockT);

	expect(result).toBe('Value is invalid');
	expect(mockT).toHaveBeenCalledWith('validation_value_is_invalid');
});

test('formatValidationRule formats supported operator with correct params', () => {
	const mockT = vi.fn((key: string, params?: any) => {
		if (key === 'validationError.contains') {
			return `Value has to contain ${params?.substring}`;
		}

		return key;
	});

	const node: ValidationNode = {
		type: 'rule',
		field: 'test_field',
		operator: 'contains',
		value: 'test',
	};

	const result = formatValidationRule(node, mockT);

	expect(result).toBe('Value has to contain "test"');
	expect(mockT).toHaveBeenCalledWith('validationError.contains', { substring: '"test"' });
});

test('parseValidationStructure correctly parses nested _and and _or groups', () => {
	const validation = {
		_and: [
			{
				name: {
					_contains: 'test',
				},
			},
			{
				_or: [
					{
						email: {
							_eq: 'test@example.com',
						},
					},
					{
						age: {
							_gt: 18,
						},
					},
				],
			},
		],
	};

	const result = parseValidationStructure(validation);

	expect(result).not.toBeNull();
	expect(result?.type).toBe('and');
	expect(result?.children).toHaveLength(2);
	expect(result?.children?.[0]?.type).toBe('rule');
	expect(result?.children?.[0]?.field).toBe('name');
	expect(result?.children?.[0]?.operator).toBe('contains');
	expect(result?.children?.[0]?.value).toBe('test');
	expect(result?.children?.[1]?.type).toBe('or');
	expect(result?.children?.[1]?.children).toHaveLength(2);
	expect(result?.children?.[1]?.children?.[0]?.field).toBe('email');
	expect(result?.children?.[1]?.children?.[0]?.operator).toBe('eq');
	expect(result?.children?.[1]?.children?.[1]?.field).toBe('age');
	expect(result?.children?.[1]?.children?.[1]?.operator).toBe('gt');
});

test('parseValidationStructure returns null for array input', () => {
	const validation = [
		{
			name: {
				_eq: 'test',
			},
		},
	];

	const result = parseValidationStructure(validation);

	expect(result).toBeNull();
});

test('parseValidationStructure returns null for null input', () => {
	const validation = null;

	const result = parseValidationStructure(validation);

	expect(result).toBeNull();
});
