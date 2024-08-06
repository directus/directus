import { toArray, toBoolean } from '@directus/utils';
import { toNumber, toString } from 'lodash-es';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getDefaultType } from '../utils/get-default-type.js';
import { guessType } from '../utils/guess-type.js';
import { getCastFlag } from '../utils/has-cast-prefix.js';
import { tryJson } from '../utils/try-json.js';
import { cast } from './cast.js';

vi.mock('@directus/utils');
vi.mock('lodash-es');
vi.mock('../utils/get-default-type.js');
vi.mock('../utils/guess-type.js');
vi.mock('../utils/has-cast-prefix.js');
vi.mock('../utils/try-json.js');

afterEach(() => {
	vi.clearAllMocks();
});

describe('Type extraction', () => {
	test('Uses cast flag if exists', () => {
		vi.mocked(getCastFlag).mockReturnValue('string');

		cast('string:value', 'key');

		expect(getCastFlag).toHaveBeenCalledWith('string:value');
		expect(toString).toHaveBeenCalledWith('value');
	});

	test('Uses cast flag for array with nested cast flags if exists', () => {
		vi.mocked(getCastFlag).mockImplementation((val) => {
			if (String(val).startsWith('array')) return 'array';
			if (String(val).startsWith('string')) return 'string';
			return 'number';
		});

		vi.mocked(toString).mockReturnValue('hey');
		vi.mocked(toNumber).mockReturnValue(1);
		vi.mocked(toArray).mockReturnValue(['string:hey', 'number:1']);

		const res = cast('array:string:hey,number:1', 'key');

		expect(getCastFlag).toHaveBeenNthCalledWith(1, 'array:string:hey,number:1');
		expect(getCastFlag).toHaveBeenCalledWith('string:hey');
		expect(getCastFlag).toHaveBeenCalledWith('number:1');
		expect(toString).toHaveBeenCalledWith('hey');
		expect(toArray).toHaveBeenCalledWith('string:hey,number:1');
		expect(toNumber).toHaveBeenCalledWith('1');
		expect(res).toEqual(['hey', 1]);
	});

	test('Uses type map entry if cast flag does not exist', () => {
		vi.mocked(getCastFlag).mockReturnValue(null);
		vi.mocked(getDefaultType).mockReturnValue('string');

		cast('value', 'key');

		expect(getDefaultType).toHaveBeenCalledWith('key');
		expect(toString).toHaveBeenCalledWith('value');
	});

	test('Uses guessed type if no flag or type map entry exist', () => {
		vi.mocked(getCastFlag).mockReturnValue(null);
		vi.mocked(getDefaultType).mockReturnValue(null);
		vi.mocked(guessType).mockReturnValue('string');

		cast('value', 'key');

		expect(guessType).toHaveBeenCalledWith('value');
		expect(toString).toHaveBeenCalledWith('value');
	});
});

describe('Casting', () => {
	test('Uses toString for string types', () => {
		vi.mocked(getCastFlag).mockReturnValue('string');

		vi.mocked(toString).mockReturnValue('cast-value');
		expect(cast('value')).toBe('cast-value');
	});

	test('Uses toNumber for number types', () => {
		vi.mocked(getCastFlag).mockReturnValue('number');

		vi.mocked(toNumber).mockReturnValue(123);
		expect(cast('value')).toBe(123);
	});

	test('Uses toBoolean for boolean types', () => {
		vi.mocked(getCastFlag).mockReturnValue('boolean');

		vi.mocked(toBoolean).mockReturnValue(false);
		expect(cast('value')).toBe(false);
	});

	test('Uses RegExp for regex types', () => {
		vi.mocked(getCastFlag).mockReturnValue('regex');
		expect(cast('value')).toBeInstanceOf(RegExp);
	});

	test('Uses toArray for array types', () => {
		vi.mocked(getCastFlag).mockImplementation((v) => {
			if (String(v).startsWith('array')) return 'array';
			return null;
		});

		vi.mocked(guessType).mockReturnValue('number');
		vi.mocked(toNumber).mockImplementation((v) => v);
		vi.mocked(toArray).mockReturnValue([1, 2, 3]);

		expect(cast('array:value')).toEqual([1, 2, 3]);
	});

	test('Filters empty strings values out of the array', () => {
		vi.mocked(getCastFlag).mockImplementation((v) => {
			if (String(v).startsWith('array')) return 'array';
			return null;
		});

		vi.mocked(toArray).mockReturnValue(['', '']);

		expect(cast('array:,')).toEqual([]);
	});

	test('Uses tryJson for json types', () => {
		vi.mocked(getCastFlag).mockReturnValue('json');

		vi.mocked(tryJson).mockReturnValue('cast-value');
		expect(cast('value')).toBe('cast-value');
	});
});
