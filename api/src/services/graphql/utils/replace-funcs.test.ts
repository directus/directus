import { describe, expect, test } from 'vitest';
import { setDeep } from '../../../utils/set-deep.js';
import { replaceFuncs } from './replace-funcs.js';

describe('replaceFuncs', () => {
	test('replaces a function filter with its Directus form', () => {
		expect(replaceFuncs({ date_created_func: { year: { _eq: 2024 } } })).toEqual({
			'year(date_created)': { _eq: 2024 },
		});
	});

	test('replaces function filters inside logical operators', () => {
		expect(replaceFuncs({ _and: [{ date_created_func: { month: { _eq: 5 } } }] })).toEqual({
			_and: [{ 'month(date_created)': { _eq: 5 } }],
		});
	});

	test('replaces function filters in a deep query built from null-prototype objects', () => {
		// `getQuery` builds `deep` with `setDeep`, which creates every missing node without a prototype
		const deep = setDeep(Object.create(null), ['comments', '_filter'], {
			date_created_func: { year: { _eq: 2024 } },
		});

		setDeep(deep, ['comments', 'replies', '_filter'], { date_created_func: { month: { _eq: 5 } } });

		expect(JSON.parse(JSON.stringify(replaceFuncs(deep)))).toEqual({
			comments: {
				_filter: { 'year(date_created)': { _eq: 2024 } },
				replies: { _filter: { 'month(date_created)': { _eq: 5 } } },
			},
		});
	});

	test('leaves values that are not objects or arrays as they are', () => {
		const date = new Date(0);

		expect(replaceFuncs({ date_created: { _eq: date } } as any)).toEqual({ date_created: { _eq: date } });
	});
});
