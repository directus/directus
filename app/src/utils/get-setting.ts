import { useSettingsStore } from '@/stores';
import { Settings } from '@directus/shared/types';

export default function getSetting(setting: keyof Settings): any {
	const settingsStore = useSettingsStore();
	if (settingsStore.settings) return settingsStore.settings[setting];
	return null;
}
