import type { ContentVersion } from '@directus/types';
import { computed, type MaybeRef, unref } from 'vue';
import { MODULE_BAR_DEFAULT } from '@/constants';
import { useSettingsStore } from '@/stores/settings';
import { normalizeUrl } from '@/utils/normalize-url';

interface UseVisualEditingOptions {
	/** Preview URL to check (will be normalized internally) */
	previewUrl: MaybeRef<string | null>;
	/** Whether this is a new item - visual editing is disabled for new items. Defaults to false. */
	isNew?: MaybeRef<boolean>;
	/** Current content version - visual editing is disabled for non-main versions. Defaults to null (main). */
	currentVersion?: MaybeRef<ContentVersion | null>;
}

/**
 * Handles visual editing prerequisites check.
 * Returns whether visual editing can be enabled and the allowed URLs for sameOrigin validation.
 *
 * Note: This checks prerequisites only. The live-preview component does the final
 * sameOrigin validation against the currently displayed URL.
 */
export function useVisualEditing({ previewUrl, isNew = false, currentVersion = null }: UseVisualEditingOptions) {
	const settingsStore = useSettingsStore();
	const moduleBar = computed(() => settingsStore.settings?.module_bar ?? MODULE_BAR_DEFAULT);

	const visualEditorUrls = computed(
		() => settingsStore.settings?.visual_editor_urls?.map(({ url }) => url).filter(Boolean) ?? [],
	);

	const visualModuleEnabled = computed(() =>
		moduleBar.value.some((part) => part.type === 'module' && part.id === 'visual' && part.enabled),
	);

	const normalizedPreviewUrl = computed(() => normalizeUrl(unref(previewUrl)));

	/** Prerequisites check - live-preview does the final sameOrigin validation */
	const visualEditingEnabled = computed(
		() =>
			!!normalizedPreviewUrl.value &&
			!unref(isNew) &&
			unref(currentVersion) === null &&
			visualModuleEnabled.value &&
			visualEditorUrls.value.length > 0,
	);

	return { visualEditingEnabled, visualEditorUrls };
}
