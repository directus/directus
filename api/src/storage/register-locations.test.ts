import { registerLocations } from './register-locations.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { useEnv } from '@directus/env';
import type { StorageManager } from '@directus/storage';
import { randNumber, randWord } from '@ngneat/falso';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('@directus/env');

vi.mock('../utils/get-config-from-env.js');

vi.mock('../constants.js', () => ({ RESUMABLE_UPLOADS: { CHUNK_SIZE: 9999 } }));

let sample: {
	options: {
		[location: string]: {
			[key: string]: any;
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
			tus: { chunkSize: 9999 },
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
