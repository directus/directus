import type {
	RichTextBubbleMenu,
	RichTextConfig,
	RichTextOptionValues,
	RichTextPerField,
	RichTextToolbarButton,
} from '@directus/extensions';
import type { AnyExtension } from '@tiptap/core';
import { isPlainObject } from 'lodash-es';
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

export interface ResolvedRichText {
	id: string;
	name: string;
	/** Differs between two fields whose option values differ, so they never share a schema verdict. */
	key: string;
	extensions: AnyExtension[];
	buttons: RichTextToolbarButton[];
	bubbleMenus: RichTextBubbleMenu[];
}

const sortedEntries = (value: object) => Object.entries(value).sort(([a], [b]) => (a < b ? -1 : Number(a > b)));

// sorted keys: the same values must give the same cache key whatever order they were saved in
export const stableStringify = (value: unknown): string =>
	JSON.stringify(value, (_, nested) => (isPlainObject(nested) ? Object.fromEntries(sortedEntries(nested)) : nested)) ??
	'';

export function optionValues(config: RichTextConfig, stored?: unknown): RichTextOptionValues {
	const defaults = Object.fromEntries(
		(config.options ?? []).flatMap((option) =>
			typeof option.field === 'string' && option.schema?.default_value !== undefined
				? [[option.field, option.schema.default_value]]
				: [],
		),
	);

	return { ...defaults, ...(isPlainObject(stored) ? (stored as RichTextOptionValues) : {}) };
}

const perField = <T>(entries: RichTextPerField<T, RichTextOptionValues> | undefined, values: RichTextOptionValues) =>
	typeof entries === 'function' ? entries(values) : (entries ?? []);

const reported = new Set<string>();

/** Returns null when a factory throws for these values: the field then loads without the extension. */
export function resolveRichText(config: RichTextConfig, stored?: unknown): ResolvedRichText | null {
	const values = optionValues(config, stored);
	const key = `${config.id}\u0001${stableStringify(values)}`;

	try {
		return {
			id: config.id,
			name: config.name,
			key,
			extensions: perField(config.extensions, values),
			buttons: perField(config.buttons, values),
			bubbleMenus: perField(config.bubbleMenus, values),
		};
	} catch (error) {
		if (!reported.has(key)) {
			reported.add(key);

			// eslint-disable-next-line no-console
			console.error(
				`Richtext extension "${config.id}" was left out of a field with the options ${stableStringify(values)}: ` +
					(error instanceof Error ? error.message : String(error)),
			);
		}

		return null;
	}
}

/**
 * The extensions a single field switched on, in registration order, resolved for the field's
 * `extensionOptions`. Nothing is on by default: installing an extension must not change the schema
 * of a field that never opted in.
 */
export const enabledRichTexts = (ids: string[] | null | undefined, extensionOptions?: unknown): ResolvedRichText[] => {
	if (!ids?.length) return [];

	const stored = isPlainObject(extensionOptions) ? (extensionOptions as Record<string, unknown>) : {};

	return richTexts.value
		.filter((config) => ids.includes(config.id))
		.flatMap((config) => resolveRichText(config, stored[config.id]) ?? []);
};

// prefixed with the extension id so a bare key like `bold` cannot replace the core button
export const contributedKey = (config: { id: string }, entry: { key: string }): string => `${config.id}:${entry.key}`;
