import { normalizeUrl } from './normalize-url';
import { useSettingsStore } from '@/stores/settings';

export function getSettingsUrls() {
	const { settings } = useSettingsStore();
	const settingsUrls = settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || [];
	return settingsUrls.map(normalizeUrl).filter(Boolean);
}
