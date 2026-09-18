import type { RichTextConfig } from '@directus/extensions';
import { shallowRef, type ShallowRef } from 'vue';

const richTexts = shallowRef<RichTextConfig[]>([]);

/**
 * `AppExtensionConfigs.richtexts` is `unknown[]` so that @directus/types stays free of Tiptap. This
 * is the one place that gives the configs their real type, mirroring how themes register into their
 * own store rather than through the shared extensions record.
 */
export const registerRichTexts = (configs: unknown[]) => {
	richTexts.value = configs as RichTextConfig[];
};

export const useRichTexts = (): ShallowRef<RichTextConfig[]> => richTexts;

/**
 * The configs a single field switched on, in registration order. Nothing is on by default:
 * installing an extension must not change the schema of a field that never opted in.
 */
export const enabledRichTexts = (ids: string[] | null | undefined): RichTextConfig[] => {
	if (!ids?.length) return [];
	return richTexts.value.filter((config) => ids.includes(config.id));
};
