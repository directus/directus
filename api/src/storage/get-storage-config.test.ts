import { test, expect, afterEach, vi } from 'vitest';
import { getStorageConfig } from './get-storage-config';
import { getEnv } from '../env';
import { getConfigFromEnv } from '../utils/get-config-from-env';

vi.mock('../env');
vi.mock('../utils/get-config-from-env');

afterEach(() => {
	vi.clearAllMocks();
});

test('Creates disks config from STORAGE_LOCATIONS', () => {
	vi.mocked(getEnv).mockReturnValueOnce({ STORAGE_LOCATIONS: '' });

	const config = getStorageConfig();

	expect(config).toStrictEqual({
		disks: {},
	});
});

test('Trims location name in CSV', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		STORAGE_LOCATIONS: 'space , another',
	});

	vi.mocked(getConfigFromEnv).mockReturnValue({});

	const config = getStorageConfig();

	expect(config).toStrictEqual({
		disks: {
			another: {
				config: {},
				driver: undefined,
			},
			space: {
				config: {},
				driver: undefined,
			},
		},
	});
});

test('Grabs driver and config from env', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		STORAGE_LOCATIONS: 'space , another',
		STORAGE_SPACE_DRIVER: 'local',
		STORAGE_ANOTHER_DRIVER: 'another',
	});

	const mockConfig = {};

	vi.mocked(getConfigFromEnv).mockReturnValue(mockConfig);

	const config = getStorageConfig();

	expect(config).toStrictEqual({
		disks: {
			another: {
				config: mockConfig,
				driver: 'another',
			},
			space: {
				config: mockConfig,
				driver: 'local',
			},
		},
	});
});

test('Removes publicUrl and driver from config object', () => {
	vi.mocked(getEnv).mockReturnValueOnce({
		STORAGE_LOCATIONS: 'space , another',
		STORAGE_SPACE_DRIVER: 'local',
		STORAGE_ANOTHER_DRIVER: 'another',
	});

	const mockConfig = {
		publicUrl: 'x',
		driver: 'y',
		foo: 'bar',
	};

	vi.mocked(getConfigFromEnv).mockReturnValue(mockConfig);

	const config = getStorageConfig();

	expect(config).toStrictEqual({
		disks: {
			another: {
				config: {
					foo: 'bar',
				},
				driver: 'another',
			},
			space: {
				config: {
					foo: 'bar',
				},
				driver: 'local',
			},
		},
	});
});
