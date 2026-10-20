import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getLicenseKey } from './get-license-key.js';

const settings = vi.hoisted(() => ({ readSingleton: vi.fn() }));

vi.mock('@directus/env', () => ({ useEnv: vi.fn() }));

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn(function () {
		return settings;
	}),
}));

vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({});
	settings.readSingleton.mockResolvedValue({ license_key: 'D0001-00000-00000-00000-0000J' });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getLicenseKey', () => {
	test('an env key takes precedence over settings', async () => {
		vi.mocked(useEnv).mockReturnValue({ LICENSE_KEY: 'D0000-00000-00000-00000-0000K' });

		expect(await getLicenseKey()).toEqual({ source: 'env', key: 'D0000-00000-00000-00000-0000K' });
	});

	test('an env token hides a key persisted in settings', async () => {
		vi.mocked(useEnv).mockReturnValue({ LICENSE_TOKEN: 'token' });

		expect(await getLicenseKey()).toEqual({ source: 'env', key: null });
		expect(settings.readSingleton).not.toHaveBeenCalled();
	});

	test('without env, the key comes from settings', async () => {
		expect(await getLicenseKey()).toEqual({ source: 'settings', key: 'D0001-00000-00000-00000-0000J' });
	});

	test('without env or a persisted key there is no source', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: null });

		expect(await getLicenseKey()).toEqual({ source: null, key: null });
	});
});
