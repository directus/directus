import { InvalidPayloadError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetEnv, setEnv } from '../../../test-utils/env.js';
import { assertValidStorageLocation } from './assert-valid-storage-location.js';

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../../../test-utils/env.js');

	return mockUseEnv();
});

describe('assertValidStorageLocation', () => {
	beforeEach(() => {
		resetEnv();
		setEnv({ STORAGE_LOCATIONS: ['local', 's3'] });
	});

	test('allows a configured location', () => {
		expect(() => assertValidStorageLocation('local')).not.toThrow();
		expect(() => assertValidStorageLocation('s3')).not.toThrow();
	});

	test.each([['missing'], ['LOCAL'], [' s3'], [''], [null], [undefined], [1]])('rejects %j', (storage) => {
		expect(() => assertValidStorageLocation(storage)).toThrow(InvalidPayloadError);
	});
});
