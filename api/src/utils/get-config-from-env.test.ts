import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest';
import { getConfigFromEnv } from './get-config-from-env.js';
import { useEnv } from '../env.js';

vi.mock('../env.js');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		OBJECT_BRAND__COLOR: 'purple',
		OBJECT_BRAND__HEX: '#6644FF',
		CAMELCASE_OBJECT__FIRST_KEY: 'firstValue',
		CAMELCASE_OBJECT__SECOND_KEY: 'secondValue',
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
});
