import { joinFilterWithCases } from './join-filter-with-cases.js';
import { expect, test } from 'vitest';

test('No filter and no cases', () => {
	const result = joinFilterWithCases(null, []);

	expect(result).toBeNull();
});

test('Filter but no cases', () => {
	const result = joinFilterWithCases({ field: { _eq: 1 } }, []);

	expect(result).toEqual({
		field: {
			_eq: 1,
		},
	});
});

test('No filter but cases', () => {
	const result = joinFilterWithCases(null, [{ case1: { _eq: 1 } }, { case2: { _eq: 2 } }]);

	expect(result).toEqual({
		_or: [{ case1: { _eq: 1 } }, { case2: { _eq: 2 } }],
	});
});

test('With filter and cases', () => {
	const result = joinFilterWithCases({ field: { _eq: 1 } }, [{ case1: { _eq: 1 } }, { case2: { _eq: 2 } }]);

	expect(result).toEqual({
		_and: [
			{ field: { _eq: 1 } },
			{
				_or: [{ case1: { _eq: 1 } }, { case2: { _eq: 2 } }],
			},
		],
	});
});
