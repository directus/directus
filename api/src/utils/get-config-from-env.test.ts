import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getConfigFromEnv } from './get-config-from-env.js';

vi.mock('@directus/env');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		CASING_KEY: 'key',
		CASING_KEY_value: 'value',
		OBJECT_BRAND__COLOR: 'purple',
		OBJECT_BRAND__HEX: '#6644FF',
		CAMELCASE_OBJECT__FIRST_KEY: 'firstValue',
		CAMELCASE_OBJECT__SECOND_KEY: 'secondValue',
		OMIT_PREFIX_FIRST_KEY: 'firstKey',
		OMIT_PREFIX_FIRST_KEY_VALUE: 'firstValue',
		OMIT_PREFIX_FIRST_VALUE: 'firstValue',
		OMIT_PREFIX_SECOND_KEY: 'secondKey',
		OMIT_PREFIX_SECOND_KEY_VALUE: 'secondValue',
		OMIT_KEY_FIRST_KEY: 'firstKey',
		OMIT_KEY_FIRST_KEY_VALUE: 'firstValue',
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('get config from env', () => {
	test('Should return config irrespective of prefix or key casing', () => {
		expect(getConfigFromEnv('CaSInG_')).toStrictEqual({ key: 'key', keyValue: 'value' });
	});

	test('Keys with double underscore should be an object', () => {
		expect(getConfigFromEnv('OBJECT_')).toStrictEqual({ brand: { color: 'purple', hex: '#6644FF' } });
	});

	test('Keys with double underscore should be an object with camelCase keys', () => {
		expect(getConfigFromEnv('CAMELCASE_')).toStrictEqual({
			object: { firstKey: 'firstValue', secondKey: 'secondValue' },
		});
	});

	test('Keys with double underscore and type underscore should be an object with snake_case keys', () => {
		expect(getConfigFromEnv('CAMELCASE_', { type: 'underscore' })).toStrictEqual({
			object: { first_key: 'firstValue', second_key: 'secondValue' },
		});
	});

	test('Keys starting with the prefix(es) listed in omitPrefix should be omitted', () => {
		expect(getConfigFromEnv('OMIT_PREFIX_', { omitPrefix: 'OMIT_PREFIX_FIRST_KEY' })).toStrictEqual({
			firstValue: 'firstValue',
			secondKey: 'secondKey',
			secondKeyValue: 'secondValue',
		});

		expect(getConfigFromEnv('OMIT_PREFIX_', { omitPrefix: ['OMIT_PREFIX_FIRST_'] })).toStrictEqual({
			secondKey: 'secondKey',
			secondKeyValue: 'secondValue',
		});
	});

	test('Keys equal to the key(s) listed in omitKeys should be omitted', () => {
		expect(getConfigFromEnv('OMIT_KEY_', { omitKey: 'OMIT_KEY_FIRST_KEY' })).toStrictEqual({
			firstKeyValue: 'firstValue',
		});

		expect(getConfigFromEnv('OMIT_KEY_', { omitKey: ['OMIT_KEY_FIRST_KEY_VALUE'] })).toStrictEqual({
			firstKey: 'firstKey',
		});
	});
});
