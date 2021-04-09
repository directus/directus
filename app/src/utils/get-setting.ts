import { useSettingsStore } from '@/stores';

export default function getSetting(setting: string) {
	const settingsStore = useSettingsStore();
	if (settingsStore.state.settings && setting in settingsStore.state.settings)
		return settingsStore.state.settings[setting];
	return null;
}
