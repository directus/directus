import { applyOptionsData, optionToObject, optionToString } from './apply-options-data.js';
import { describe, expect, it } from 'vitest';

describe('applyOptionsData', () => {
	it('returns an empty object if the options are empty', () => {
		expect(applyOptionsData({}, {})).toEqual({});
	});

	it('returns the unchanged options if there are no mustaches', () => {
		expect(
			applyOptionsData(
				{ str: 'num', arr: ['arr', { null: null }], obj: { str: 'obj', num: 42 } },
				{ num: 42, arr: ['foo', 'bar'], obj: { foo: 'bar' } },
			),
		).toEqual({ str: 'num', arr: ['arr', { null: null }], obj: { str: 'obj', num: 42 } });
	});

	it('returns the options with any raw template replaced by the value in scope', () => {
		expect(
			applyOptionsData(
				{ str: '{{ num }}', arr: ['{{ arr }}', { null: null }], obj: { str: '{{ obj }}', num: 42 } },
				{ num: 42, arr: ['foo', 'bar'], obj: { foo: 'bar' } },
			),
		).toEqual({ str: 42, arr: [['foo', 'bar'], { null: null }], obj: { str: { foo: 'bar' }, num: 42 } });
	});

	it('returns the options with any non-raw template rendered with the respective stringified values from the scope', () => {
		expect(
			applyOptionsData(
				{ str: 'num: {{ num }}', arr: ['arr: {{ arr }}', { null: null }], obj: { str: 'obj: {{ obj }}', num: 42 } },
				{ num: 42, arr: ['foo', 'bar'], obj: { foo: 'bar' } },
			),
		).toEqual({
			str: 'num: 42',
			arr: ['arr: ["foo","bar"]', { null: null }],
			obj: { str: 'obj: {"foo":"bar"}', num: 42 },
		});
	});

	it('returns the options with raw templates with null scope values as literal null and undefined scope values as string undefined', () => {
		expect(applyOptionsData({ null: '{{ null }}', undefined: '{{ undefined }}' }, { null: null })).toEqual({
			null: null,
			undefined: 'undefined',
		});
	});

	it('returns the options with non-raw templates which reference null or undefined scope values as literal null and undefined strings', () => {
		expect(
			applyOptionsData({ null: 'null: {{ null }}', undefined: 'undefined: {{ undefined }}' }, { null: null }),
		).toEqual({
			null: 'null: null',
			undefined: 'undefined: undefined',
		});
	});

	it('does not skip values in a template if they are not undefined', () => {
		expect(applyOptionsData({ skip: '{{ num }}', keep: '{{ num }}' }, { num: 42 }, ['skip'])).toEqual({
			skip: 42,
			keep: 42,
		});

		expect(applyOptionsData({ skip: 'num: {{ num }}', keep: 'num: {{ num }}' }, { num: 42 }, ['skip'])).toEqual({
			skip: 'num: 42',
			keep: 'num: 42',
		});
	});

	it('skips over values in a template which are undefined', () => {
		expect(applyOptionsData({ skip: '{{ num }}', keep: '{{ num }}' }, {}, ['skip'])).toEqual({
			skip: '{{ num }}',
			keep: 'undefined',
		});

		expect(applyOptionsData({ skip: 'num: {{ num }}', keep: 'num: {{ num }}' }, {}, ['skip'])).toEqual({
			skip: 'num: {{ num }}',
			keep: 'num: undefined',
		});
	});
});

describe('optionToObject', () => {
	it('returns the option parsed from json if the option is a string', () => {
		expect(optionToObject('{ "foo": 42 }')).toEqual({ foo: 42 });
	});

	it('returns the unchanged option if it is not a string', () => {
		expect(optionToObject(['foo', 42])).toEqual(['foo', 42]);
	});
});

describe('optionToObject', () => {
	it('returns the option stringified to json if it is an object or array', () => {
		expect(optionToString({ foo: 42 })).toBe('{"foo":42}');
	});

	it('returns the option converted to a string if it is not an object or array', () => {
		expect(optionToString(42)).toBe('42');
	});
});
