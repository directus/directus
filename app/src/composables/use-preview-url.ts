import type { Collection, PrimaryKey } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { computed, type ComputedRef, type Ref } from 'vue';
import { useTemplateData } from '@/composables/use-template-data';
import { useSettingsStore } from '@/stores/settings';
import type { ContentVersionMaybeNew } from '@/types/versions';
import { getPreviewVersionKey } from '@/utils/get-preview-version-key';
import { renderStringTemplate } from '@/utils/render-string-template';

const PREVIEW_BASE_URL_VARIABLE = '$preview_base_url';

/**
 * Resolves a collection's Preview URL template into the URL the live preview loads.
 */
export function usePreviewUrl(
	collection: Ref<Collection | null>,
	primaryKey: Ref<PrimaryKey | null>,
	currentVersion: Ref<ContentVersionMaybeNew | null>,
): {
	previewUrl: ComputedRef<string | null>;
	previewConfigured: ComputedRef<boolean>;
	fetchTemplateValues: () => Promise<void>;
} {
	const settingsStore = useSettingsStore();

	const template = computed(() => collection.value?.meta?.preview_url ?? '');

	// Stripped so a base URL saved with a trailing slash doesn't double up against the template path
	const baseUrl = computed(() => (settingsStore.settings?.preview_base_url ?? '').replace(/\/+$/, ''));

	// Deliberately independent of the fetched item, so the split pane doesn't flicker while it loads
	const previewConfigured = computed(() => {
		if (!template.value) return false;

		return !(getFieldsFromTemplate(template.value).includes(PREVIEW_BASE_URL_VARIABLE) && !baseUrl.value);
	});

	const { templateData, fetchTemplateValues } = useTemplateData(collection, primaryKey, {
		template,
		injectData: computed(() => ({
			$version: getPreviewVersionKey(currentVersion.value),
			[PREVIEW_BASE_URL_VARIABLE]: baseUrl.value,
		})),
	});

	const previewUrl = computed(() => {
		if (!previewConfigured.value) return null;

		const { displayValue } = renderStringTemplate(template.value, templateData.value);

		if (!displayValue.value) return null;

		return displayValue.value.trim() || null;
	});

	return { previewUrl, previewConfigured, fetchTemplateValues };
}
