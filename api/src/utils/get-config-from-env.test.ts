import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getConfigFromEnv } from './get-config-from-env.js';

vi.mock('@directus/env');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		OBJECT_BRAND__COLOR: 'purple',
		OBJECT_BRAND__HEX: '#6644FF',
		CAMELCASE_OBJECT__FIRST_KEY: 'firstValue',
		CAMELCASE_OBJECT__SECOND_KEY: 'secondValue',
		OBJECT2_CLIENT_ID: 0,
		OBJECT2_CLIENT_ID_ALG: 1,
		OBJECT2_CLIENT_SECRET: 2,
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('get config from env', () => {
	test('Keys with double underscore should be an object', () => {
		expect(getConfigFromEnv('OBJECT_')).toStrictEqual({ brand: { color: 'purple', hex: '#6644FF' } });
	});

	test('Keys with double underscore should be an object with camelCase keys', () => {
		expect(getConfigFromEnv('CAMELCASE_')).toStrictEqual({
			object: { firstKey: 'firstValue', secondKey: 'secondValue' },
		});
	});

	test('Any keys that start with a prefix in omitPrefix should be omitted', () => {
		expect(getConfigFromEnv('OBJECT2_', { omitPrefix: 'OBJECT2_CLIENT_ID' })).toStrictEqual({
			clientSecret: 2,
		});

		expect(getConfigFromEnv('OBJECT2_', { omitPrefix: ['OBJECT2_CLIENT_ID', 'OBJECT2_CLIENT_SECRET'] })).toStrictEqual(
			{},
		);
	});

	test('Any keys equal to a key in omitKeys should be omitted', () => {
		expect(getConfigFromEnv('OBJECT2_', { omitKey: 'OBJECT2_CLIENT_ID' })).toStrictEqual({
			clientIdAlg: 1,
			clientSecret: 2,
		});

		expect(getConfigFromEnv('OBJECT2_', { omitKey: ['OBJECT2_CLIENT_ID', 'OBJECT2_CLIENT_SECRET'] })).toStrictEqual({
			clientIdAlg: 1,
		});
	});
});
