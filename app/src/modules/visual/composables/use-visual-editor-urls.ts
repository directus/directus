import { VERSION_KEY_PUBLISHED } from '@directus/constants';
import { computed } from 'vue';
import { normalizeUrl } from '../utils/normalize-url';
import { useSettingsStore } from '@/stores/settings';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

export function useVisualEditorUrls() {
	const { settings } = useSettingsStore();
	const urlTemplates = computed(() => settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || []);

	const resolvedUrls = computed(() => resolveUrls());
	const firstResolvedUrl = computed(() => resolvedUrls.value[0] || null);

	return { urlTemplates, firstResolvedUrl, resolveUrls };

	function resolveUrls(version?: string | null) {
		const $version = version ?? VERSION_KEY_PUBLISHED;

		return urlTemplates.value
			.map((urlTemplate) => renderPlainStringTemplate(urlTemplate, { $version }) ?? urlTemplate)
			.map(normalizeUrl)
			.filter(Boolean);
	}
}
