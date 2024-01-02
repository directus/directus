import type { StorageManager } from '@directus/storage';
import { randNumber, randWord } from '@ngneat/falso';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useEnv } from '../env.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { registerLocations } from './register-locations.js';

vi.mock('../env.js');

vi.mock('../utils/get-config-from-env.js');

let sample: {
	options: {
		[location: string]: {
			[key: string]: string;
		};
	};
	locations: string[];
};

let mockStorage: StorageManager;

beforeEach(() => {
	sample = {
		options: {},
		locations: randWord({ length: randNumber({ min: 1, max: 10 }) }),
	};

	sample.locations.forEach((location) => {
		const keys = randWord({ length: randNumber({ min: 1, max: 10 }) });
		const values = randWord({ length: keys.length });

		sample.options[`STORAGE_${location.toUpperCase()}_`] = {
			driver: randWord(),
		};

		keys.forEach((key, index) => (sample.options[`STORAGE_${location.toUpperCase()}_`]![key] = values[index]!));
	});

	mockStorage = {
		registerLocation: vi.fn(),
	} as unknown as StorageManager;

	vi.mocked(getConfigFromEnv).mockImplementation((name) => sample.options[name]!);

	vi.mocked(useEnv).mockReturnValue({
		STORAGE_LOCATIONS: sample.locations.join(','),
	});
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Gets config for each location', async () => {
	await registerLocations(mockStorage);

	expect(getConfigFromEnv).toHaveBeenCalledTimes(sample.locations.length);

	sample.locations.forEach((location) =>
		expect(getConfigFromEnv).toHaveBeenCalledWith(`STORAGE_${location.toUpperCase()}_`),
	);
});

test('Registers location with driver options for each location', async () => {
	await registerLocations(mockStorage);

	expect(mockStorage.registerLocation).toHaveBeenCalledTimes(sample.locations.length);

	sample.locations.forEach((location) => {
		const { driver, ...options } = sample.options[`STORAGE_${location.toUpperCase()}_`]!;

		expect(mockStorage.registerLocation).toHaveBeenCalledWith(location, {
			driver,
			options,
		});
	});
});
