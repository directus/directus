import { useSettingsStore } from '@/stores/settings';
import { Settings } from '@directus/shared/types';

export function getSetting(setting: keyof Settings): any {
	const settingsStore = useSettingsStore();
	if (settingsStore.settings) return settingsStore.settings[setting];
	return null;
}
