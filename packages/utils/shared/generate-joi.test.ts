import type { FieldFilter } from '@directus/types';
import { escapeRegExp } from 'lodash-es';
import { describe, expect, it } from 'vitest';
import type { JoiOptions, StringSchema } from './generate-joi.js';
import { Joi, generateJoi } from './generate-joi.js';

describe(`generateJoi`, () => {
	const date = new Date(1632431505992);
	const compareDate = new Date(1632431605992);

	it(`returns an error when no key is passed`, () => {
		const mockFieldFilter = {} as FieldFilter;
		const mockError = `[generateJoi] Filter doesn't contain field key. Passed filter: {}`;

		expect(() => {
			generateJoi(mockFieldFilter);
		}).toThrowError(mockError);
	});

	it(`returns an error when no filter rule is passed`, () => {
		const mockFieldFilter = { field: { eq: undefined } } as unknown as FieldFilter;
		const mockError = `[generateJoi] Filter doesn't contain filter rule. Passed filter: {}`;

		expect(() => {
			generateJoi(mockFieldFilter);
		}).toThrowError(mockError);
	});

	it(`returns an recursively goes through nested filters`, () => {
		const mockFieldFilter = { field: { eq: { _eq: 'field' } } } as unknown as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.object({ eq: Joi.any().equal('field') }).unknown(),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema with an option of "requireAll" true`, () => {
		const mockFieldFilter = { field: { _eq: 'field' } } as FieldFilter;
		const mockOptions = { requireAll: true } as JoiOptions;

		const mockSchema = Joi.object({
			field: Joi.any().equal('field').required(),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter, mockOptions).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _eq match`, () => {
		const mockFieldFilter = { field: { _eq: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal('field'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _neq match`, () => {
		const mockFieldFilter = { field: { _neq: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not('field'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an integer _eq match`, () => {
		const mockFieldFilter = { field: { _eq: 123 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(123, '123'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an integer _neq match`, () => {
		const mockFieldFilter = { field: { _neq: 123 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(123, '123'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a string containing an integer _eq match`, () => {
		const mockFieldFilter = { field: { _eq: '123' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal('123', 123),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a string containing an integer _neq match`, () => {
		const mockFieldFilter = { field: { _neq: '123' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not('123', 123),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a float _eq match`, () => {
		const mockFieldFilter = { field: { _eq: '123.456' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal('123.456', 123.456),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a float _neq match`, () => {
		const mockFieldFilter = { field: { _neq: '123.456' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not('123.456', 123.456),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a null _eq match`, () => {
		const mockFieldFilter = { field: { _eq: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(null),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a null _neq match`, () => {
		const mockFieldFilter = { field: { _neq: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(null),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an empty string _eq match`, () => {
		const mockFieldFilter = { field: { _eq: '' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(''),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an empty string _neq match`, () => {
		const mockFieldFilter = { field: { _neq: '' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(''),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a true _eq match`, () => {
		const mockFieldFilter = { field: { _eq: true } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a true _neq match`, () => {
		const mockFieldFilter = { field: { _neq: true } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a false _eq match`, () => {
		const mockFieldFilter = { field: { _eq: false } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(false),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a false _neq match`, () => {
		const mockFieldFilter = { field: { _neq: false } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(false),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns a value if the substring is included in the value`, () => {
		expect(() => {
			Joi.assert('testfield', (Joi.string() as StringSchema).contains('field'));
		}).toEqual(expect.any(Function));
	});

	it(`returns a value if the substring is not contained in the value`, () => {
		expect(() => {
			Joi.assert('testfield', (Joi.string() as StringSchema).contains('field'));
		}).toEqual(expect.any(Function));
	});

	it(`returns an error if the substring is included in the value`, () => {
		expect(() => {
			Joi.assert('field', (Joi.string() as StringSchema).ncontains('field'));
			// eslint-disable-next-line no-useless-escape
		}).toThrowError(`\"value\" can't contain [field]`);
	});

	it(`returns an error if the substring is not contained in the value`, () => {
		expect(() => {
			Joi.assert('test', (Joi.string() as StringSchema).contains('field'));
			// eslint-disable-next-line no-useless-escape
		}).toThrowError(`\"value\" must contain [field`);
	});

	it(`returns the correct schema for a _starts_with match`, () => {
		const mockFieldFilter = { field: { _starts_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`^${escapeRegExp('field')}.*`), {
				name: 'starts_with',
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _starts_with with null value`, () => {
		const mockFieldFilter = { field: { _starts_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _nstarts_with with match`, () => {
		const mockFieldFilter = { field: { _nstarts_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`^${escapeRegExp('field')}.*`), {
				name: 'nstarts_with',
				invert: true,
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _nstarts_with with null value`, () => {
		const mockFieldFilter = { field: { _nstarts_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _istarts_with match`, () => {
		const mockFieldFilter = { field: { _istarts_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`^${escapeRegExp('field')}.*`, 'i'), {
				name: 'istarts_with',
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _istarts_with with null value`, () => {
		const mockFieldFilter = { field: { _istarts_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _nistarts_with match`, () => {
		const mockFieldFilter = { field: { _nistarts_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`^${escapeRegExp('field')}.*`, 'i'), {
				name: 'nistarts_with',
				invert: true,
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _nistarts_with with null value`, () => {
		const mockFieldFilter = { field: { _nistarts_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an ends_with match`, () => {
		const mockFieldFilter = { field: { _ends_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`.*field$`), {
				name: 'ends_with',
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an ends_with with null value`, () => {
		const mockFieldFilter = { field: { _ends_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a doesnt _nends_with match`, () => {
		const mockFieldFilter = { field: { _nends_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`.*field$`), {
				name: 'nends_with',
				invert: true,
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a doesnt _nends_with with null value`, () => {
		const mockFieldFilter = { field: { _nends_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an iends_with match`, () => {
		const mockFieldFilter = { field: { _iends_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`.*field$`, 'i'), {
				name: 'iends_with',
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an iends_with with null value`, () => {
		const mockFieldFilter = { field: { _iends_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a doesnt _niends_with match`, () => {
		const mockFieldFilter = { field: { _niends_with: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().pattern(new RegExp(`.*field$`, 'i'), {
				name: 'niends_with',
				invert: true,
			}),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a doesnt _niends_with with null value`, () => {
		const mockFieldFilter = { field: { _niends_with: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _in match`, () => {
		const mockFieldFilter = { field: { _in: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(...'field'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _in number array match`, () => {
		const mockFieldFilter = { field: { _in: [1] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(...[1]),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _in a string array match`, () => {
		const mockFieldFilter = { field: { _in: ['field', 'secondField'] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(...['field', 'secondField']),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for a _nin match`, () => {
		const mockFieldFilter = { field: { _nin: 'field' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(...'field'),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nin number array match`, () => {
		const mockFieldFilter = { field: { _nin: [1] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(...[1]),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nin a string array match`, () => {
		const mockFieldFilter = { field: { _nin: ['field', 'secondField'] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().not(...['field', 'secondField']),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gt number match`, () => {
		const mockFieldFilter = { field: { _gt: 1 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().greater(1),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gt date match`, () => {
		const mockFieldFilter = { field: { _gt: date } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().greater(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gt string match`, () => {
		const mockFieldFilter = { field: { _gt: date.toISOString() } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().greater(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gte number match`, () => {
		const mockFieldFilter = { field: { _gte: 1 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().min(1),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gte date match`, () => {
		const mockFieldFilter = { field: { _gte: date } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().min(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _gte string match`, () => {
		const mockFieldFilter = { field: { _gte: date.toISOString() } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().min(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lt number match`, () => {
		const mockFieldFilter = { field: { _lt: 1 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().less(1),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lt date match`, () => {
		const mockFieldFilter = { field: { _lt: date } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().less(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lt string match`, () => {
		const mockFieldFilter = { field: { _lt: date.toISOString() } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().less(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lte number match`, () => {
		const mockFieldFilter = { field: { _lte: 1 } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().max(1),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lte date match`, () => {
		const mockFieldFilter = { field: { _lte: date } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().max(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _lte string match`, () => {
		const mockFieldFilter = { field: { _lte: date.toISOString() } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().max(date),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _null match`, () => {
		const mockFieldFilter = { field: { _null: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().valid(null),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nnull match`, () => {
		const mockFieldFilter = { field: { _nnull: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().invalid(null),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _empty match`, () => {
		const mockFieldFilter = { field: { _empty: '' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().valid(''),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nempty match`, () => {
		const mockFieldFilter = { field: { _nempty: '' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().invalid(''),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _between number match`, () => {
		const mockFieldFilter = { field: { _between: [1, 3] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().min(1).max(3),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _between float match`, () => {
		const mockFieldFilter = { field: { _between: [1.111, 3.333] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().min(1.111).max(3.333),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _between date match`, () => {
		const mockFieldFilter = { field: { _between: [date, compareDate] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().min(date).max(compareDate),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nbetween number match`, () => {
		const mockFieldFilter = { field: { _nbetween: [1, 3] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().less(1).greater(3),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nbetween float match`, () => {
		const mockFieldFilter = { field: { _nbetween: [1.111, 3.333] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.number().less(1.111).greater(3.333),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _nbetween date match`, () => {
		const mockFieldFilter = { field: { _nbetween: [date, compareDate] } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.date().less(date).greater(compareDate),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _submitted match`, () => {
		const mockFieldFilter = { field: { _submitted: '' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().required(),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _regex match when wrapped`, () => {
		const mockFieldFilter = { field: { _regex: '/.*field$/' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().min(0).regex(new RegExp(`.*field$`)),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _regex match when unwrapped`, () => {
		const mockFieldFilter = { field: { _regex: '.*field$' } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.string().min(0).regex(new RegExp(`.*field$`)),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});

	it(`returns the correct schema for an _regex match with null value`, () => {
		const mockFieldFilter = { field: { _regex: null } } as FieldFilter;

		const mockSchema = Joi.object({
			field: Joi.any().equal(true),
		})
			.unknown()
			.describe();

		expect(generateJoi(mockFieldFilter).describe()).toStrictEqual(mockSchema);
	});
});
