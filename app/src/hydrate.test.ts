import { setLanguage } from '@/lang/set-language';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useUserStore } from '@/stores/user';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useAppStore } from '@/stores/app';

import { hydrate } from './hydrate';
import { defaultBasemap } from './utils/geometry/basemap';

vi.mock('@/lang/set-language', () => ({
	setLanguage: vi.fn(),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		})
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('setLanguage', () => {
	test('should not be called with null project default language (in runtime)', async () => {
		const serverStore = useServerStore();
		serverStore.info = { project: { default_language: null } } as any;

		await hydrate();

		expect(vi.mocked(setLanguage).mock.calls[0][0]).not.toBeNull();
	});

	test('should not be called with null user language (in runtime)', async () => {
		const userStore = useUserStore();
		userStore.currentUser = { language: null } as any;

		await hydrate();

		expect(vi.mocked(setLanguage).mock.calls[0][0]).not.toBeNull();
	});
});

describe('basemap', () => {
	test('should use default basemap when there is no mapbox key', async () => {
		const appStore = useAppStore();
		const settingsStore = useSettingsStore();
		settingsStore.settings = { mapbox_key: null } as any;

		await hydrate();

		expect(appStore.basemap).toBe(defaultBasemap.name);
	});

	test('should use default mapbox basemap when there is mapbox key', async () => {
		const appStore = useAppStore();
		const settingsStore = useSettingsStore();
		settingsStore.settings = { mapbox_key: 'sample_mapbox_key' } as any;

		await hydrate();

		expect(appStore.basemap).toBe('Mapbox');
	});
});
