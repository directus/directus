import type { Field } from '@directus/types';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { normalizeSlugValue } from '@/utils/normalize-input-value';

export type AiTranslateAvailabilityOptions = {
	aiEnabled: boolean;
	availableProviderCount: number;
	availableModelCount: number;
	disabled?: boolean;
	nonEditable?: boolean;
};

export type TranslationTargetPermissionReason = 'not-allowed' | 'pending-delete';

export type TranslationTargetPermissionResult = {
	allowed: boolean;
	reason?: TranslationTargetPermissionReason;
};

export type AiTranslationFieldBehavior = 'plain-text' | 'slug-safe' | 'markdown' | 'html';

export type AiTranslationPromptOptions = {
	sourceLangName: string;
	targetLangNames: string[];
	sourceContent: Record<string, string>;
	fields: Field[];
	styleGuide?: string | null;
	glossary?: Array<{ term: string; translation_note: string }> | null;
};

export function isAiTranslateAvailable({
	aiEnabled,
	availableProviderCount,
	availableModelCount,
	disabled = false,
	nonEditable = false,
}: AiTranslateAvailabilityOptions): boolean {
	return aiEnabled && availableProviderCount > 0 && availableModelCount > 0 && !disabled && !nonEditable;
}

export function buildAiTranslationDraft(
	existingItem: DisplayItem | undefined,
	getItemEdits: (item: DisplayItem) => DisplayItem,
	translatedFields: Record<string, string>,
): DisplayItem {
	const currentEdits = existingItem ? getItemEdits(existingItem) : undefined;

	return {
		...(currentEdits ?? {}),
		...translatedFields,
	};
}

export function getAiTranslationFieldBehavior(field: Field): AiTranslationFieldBehavior {
	if (field.meta?.options?.slug === true) {
		return 'slug-safe';
	}

	if (field.meta?.interface === 'input-rich-text-md') {
		return 'markdown';
	}

	if (field.meta?.interface === 'input-rich-text-html') {
		return 'html';
	}

	return 'plain-text';
}

export function getAiTranslationFieldDescription(field: Field): string {
	switch (getAiTranslationFieldBehavior(field)) {
		case 'slug-safe':
			return 'Localized URL slug. Lowercase, hyphen-separated, transliterated to ASCII, no spaces or punctuation.';
		case 'markdown':
			return 'Markdown content. Preserve markdown syntax and structure; translate prose only.';
		case 'html':
			return 'HTML content. Preserve HTML tags and attributes; translate text content only.';
		default:
			return 'Translated text content.';
	}
}

export function buildAiTranslationPrompt({
	sourceLangName,
	targetLangNames,
	sourceContent,
	fields,
	styleGuide,
	glossary,
}: AiTranslationPromptOptions): string {
	let prompt = `Translate the following content from ${sourceLangName} to: ${targetLangNames.join(', ')}.\n\n`;

	if (styleGuide) {
		prompt += `## Style Guide\n${styleGuide}\n\n`;
	}

	if (glossary && glossary.length > 0) {
		prompt += `## Glossary\nThese terms must be handled exactly as noted:\n`;

		for (const entry of glossary) {
			prompt += `- "${entry.term}" -> ${entry.translation_note}\n`;
		}

		prompt += '\n';
	}

	if (fields.length > 0) {
		prompt += '## Field Rules\n';

		for (const field of fields) {
			prompt += `- "${field.field}": ${getAiTranslationFieldInstruction(field)}\n`;
		}

		prompt += '\n';
	}

	prompt += `## Source Content (${sourceLangName})\n`;
	prompt += JSON.stringify(sourceContent, null, 2);
	prompt += '\n\nReturn one translated string for each requested field. Do not translate JSON keys.';

	return prompt;
}

export function normalizeAiTranslatedFields(
	translatedFields: Record<string, string>,
	fields: Field[],
): Record<string, string> {
	const fieldsByName = new Map(fields.map((field) => [field.field, field]));

	return Object.fromEntries(
		Object.entries(translatedFields).map(([fieldName, value]) => {
			const field = fieldsByName.get(fieldName);

			if (field && getAiTranslationFieldBehavior(field) === 'slug-safe') {
				return [fieldName, normalizeSlugValue(value)];
			}

			return [fieldName, value];
		}),
	);
}

function getAiTranslationFieldInstruction(field: Field): string {
	switch (getAiTranslationFieldBehavior(field)) {
		case 'slug-safe':
			return 'Generate a localized URL slug for the translated content. Use lowercase ASCII characters, numbers, and hyphens only. Do not keep the source slug unless it is already the correct localized slug.';
		case 'markdown':
			return 'Preserve markdown syntax and structure exactly. Translate prose only. Do not translate code fences, inline code, URLs, reference IDs, or frontmatter keys.';
		case 'html':
			return 'Preserve HTML tags and attributes. Translate text nodes only. Do not alter element names, classes, attributes, or URLs unless they are visible text content.';
		default:
			return 'Translate the text naturally for the target language.';
	}
}

export async function resolveTranslationTargetPermission({
	isAdmin,
	isMarkedForDeletion,
	itemPrimaryKey,
	hasCreatePermission,
	updatePermissionAccess,
	fetchItemUpdatePermission,
}: {
	isAdmin: boolean;
	isMarkedForDeletion: boolean;
	itemPrimaryKey: string | number | null | undefined;
	hasCreatePermission: boolean;
	updatePermissionAccess: string | null | undefined;
	fetchItemUpdatePermission: () => Promise<boolean>;
}): Promise<TranslationTargetPermissionResult> {
	if (isAdmin) {
		return { allowed: true };
	}

	if (isMarkedForDeletion) {
		return { allowed: false, reason: 'pending-delete' };
	}

	if (itemPrimaryKey === undefined || itemPrimaryKey === null) {
		return hasCreatePermission ? { allowed: true } : { allowed: false, reason: 'not-allowed' };
	}

	if (!updatePermissionAccess || updatePermissionAccess === 'none') {
		return { allowed: false, reason: 'not-allowed' };
	}

	if (updatePermissionAccess === 'full') {
		return { allowed: true };
	}

	const updateAllowed = await fetchItemUpdatePermission();

	return updateAllowed ? { allowed: true } : { allowed: false, reason: 'not-allowed' };
}
