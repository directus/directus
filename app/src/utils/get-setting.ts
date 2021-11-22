import { useSettingsStore } from '@/stores';

export default function getSetting(setting: string): any {
	const settingsStore = useSettingsStore();
	if (settingsStore.settings && setting in settingsStore.settings) return settingsStore.settings[setting];
	return null;
}
