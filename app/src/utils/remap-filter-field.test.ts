import { describe, expect, it } from 'vitest';
import { remapFilterFieldKeys } from './remap-filter-field';

describe('remapFilterFieldKeys', () => {
	it('should remap complex validation filter structure', () => {
	const filter = {
		_and: [
			{
				email: {
					_regex: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
				},
			},
			{
				_or: [],
			},
			{
				email: {
					_icontains: 'directus',
				},
			},
			{
				_or: [],
			},
			{
				email: {
					_in: [true, '12', '34', '56'],
				},
			},
		],
	};

	const result = remapFilterFieldKeys(filter, 'email', 'email_copy');

	expect(result).toEqual({
		_and: [
			{
				email_copy: {
					_regex: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
				},
			},
			{
				_or: [],
			},
			{
				email_copy: {
					_icontains: 'directus',
				},
			},
			{
				_or: [],
			},
			{
				email_copy: {
					_in: [true, '12', '34', '56'],
				},
			},
		],
	});
});

});
