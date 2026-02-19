import { computed } from 'vue';
import { normalizeUrl } from '../utils/normalize-url';
import { useSettingsStore } from '@/stores/settings';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

export function useVisualEditorUrls() {
	const { settings } = useSettingsStore();
	const urlTemplates = computed(() => settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || []);

	const urls = computed(() => getUrls());
	const firstUrl = computed(() => urls.value[0] || null);

	return { urlTemplates, firstUrl, getUrls };

	function getUrls(version = 'main') {
		return urlTemplates.value
			.map((urlTemplate) => renderPlainStringTemplate(urlTemplate, { $version: version }) ?? urlTemplate)
			.map(normalizeUrl)
			.filter(Boolean);
	}
}
