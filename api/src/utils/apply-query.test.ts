import { getFilterPath, getOperation } from './apply-query';

describe('getFilterPath tests', () => {
	test('basic get filter path', () => {
		const path = getFilterPath('field', { _in: ['A', 'B'] });
		expect(path).toStrictEqual(['field']);
	});
	test('nested get filter path', () => {
		const path = getFilterPath('field', { nested: { _eq: 'nested' } });
		expect(path).toStrictEqual(['field', 'nested']);
	});
	test('get filter path for underscored field (issue #16189)', () => {
		const path = getFilterPath('_field', { _actualField: { _contains: 'underscore' } });
		expect(path).toStrictEqual(['_field', '_actualField']);
	});
});

describe('getOperation tests', () => {
	test('basic get operation', () => {
		const { operator, value } = getOperation('field', { _in: ['A', 'B'] });
		expect(operator).toBe('_in');
		expect(value).toStrictEqual(['A', 'B']);
	});
	test('nested get operation', () => {
		const { operator, value } = getOperation('field', { nested: { _eq: 'nested' } });
		expect(operator).toBe('_eq');
		expect(value).toBe('nested');
	});
	test('get operation for underscored field (issue #16189)', () => {
		const { operator, value } = getOperation('_field', { _actualField: { _contains: 'underscore' } });
		expect(operator).toBe('_contains');
		expect(value).toBe('underscore');
	});
});
