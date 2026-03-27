import { describe, expect, test } from 'vitest';
import { collectStorage } from './storage.js';

describe('collectStorage', () => {
	test('returns empty drivers when no STORAGE_*_DRIVER vars exist', () => {
		expect(collectStorage({})).toEqual({ drivers: [] });
	});

	test('collects unique driver names from env', () => {
		const result = collectStorage({
			STORAGE_LOCAL_DRIVER: 'local',
			STORAGE_S3_DRIVER: 's3',
			STORAGE_GCS_DRIVER: 'gcs',
		});

		expect(result.drivers.sort()).toEqual(['gcs', 'local', 's3']);
	});

	test('deduplicates drivers', () => {
		const result = collectStorage({
			STORAGE_A_DRIVER: 'local',
			STORAGE_B_DRIVER: 'local',
		});

		expect(result.drivers).toEqual(['local']);
	});

	test('ignores non-STORAGE env vars', () => {
		const result = collectStorage({
			CACHE_STORE: 'redis',
			STORAGE_S3_DRIVER: 's3',
		});

		expect(result.drivers).toEqual(['s3']);
	});

	test('ignores falsy driver values', () => {
		const result = collectStorage({
			STORAGE_A_DRIVER: '',
		});

		expect(result.drivers).toEqual([]);
	});
});
