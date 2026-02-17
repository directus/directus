import { normalizeUrl } from './normalize-url';
import { useSettingsStore } from '@/stores/settings';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

export function getSettingsUrls(version = 'main') {
	const { settings } = useSettingsStore();

	const settingsUrls =
		settings?.visual_editor_urls
			?.map((item) => renderPlainStringTemplate(item.url, { $version: version }) ?? item.url)
			.filter(Boolean) || [];

	return settingsUrls.map(normalizeUrl).filter(Boolean);
}
