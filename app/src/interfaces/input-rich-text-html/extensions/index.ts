import type { RichTextBubbleMenu, RichTextToolbarButton } from '@directus/extensions';
import type { AnyExtension } from '@tiptap/core';
import { CharacterCount } from '@tiptap/extensions';
import { ComparisonDiff } from './comparison-diff';
import { buildCustomFormats, type CustomFormat } from './custom-formats';
import { Direction } from './direction';
import { DropCursor } from './drop-cursor';
import { figureExtensions } from './figure';
import { CustomImage } from './image';
import { BaseLink, buildLinkProtocolSchema } from './link-protocols';
import { Media } from './media';
import { LIST_CONTAINER_TAGS, NoContainerParagraphs } from './no-container-paragraphs';
import { PageBreak } from './page-break';
import { PreKeymap } from './pre-keymap';
import { PreservedAttributes } from './preserved-attributes';
import { RangeSelectedAtoms } from './range-selected-atoms';
import { semanticHtml } from './semantic-html';
import { BaseStarterKit, buildLegacyEmphasisSchema } from './starter-kit';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { Table } from './table';
import { TextAlignment } from './text-alignment';
import { TextStyle } from './text-style';
import { buildWrapperElementSchema } from './wrapper-elements';
import { contributedKey, enabledRichTexts } from '@/rich-text/register';

/**
 * The editor's extension set, shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift.
 */
export const editorExtensions = [
	BaseStarterKit,
	BaseLink,
	DropCursor,
	CustomImage,
	Media,
	TextAlignment,
	Direction,
	CustomSubscript,
	CustomSuperscript,
	...TextStyle,
	PageBreak,
	RangeSelectedAtoms,
	Table,
	PreKeymap,
	CharacterCount,
	...figureExtensions,
	...semanticHtml,
	PreservedAttributes,
];

/**
 * The complete extension list for a field's editor: `editorExtensions` plus the field's additions,
 * with PreservedAttributes told about every other attribute so a `data-*` or `aria-*` name that
 * another attribute parses has one owner. Every site that builds a field editor must use this.
 * An addition with a base extension's name replaces it in place.
 */
export function fieldEditorExtensions(additions: AnyExtension[]): AnyExtension[] {
	const byName = new Map(additions.map((extension) => [extension.name, extension]));
	const base = editorExtensions.map((extension) => byName.get(extension.name) ?? extension);
	const appended = additions.filter((extension) => !base.includes(extension));
	const others = [...base.filter((extension) => extension !== PreservedAttributes), ...appended];

	return [
		...base.map((extension) =>
			extension === PreservedAttributes ? PreservedAttributes.configure({ extensions: others }) : extension,
		),
		...appended,
	];
}

export interface FieldSchemaOptions {
	/** Field `customFormats` option (array or JSON string); see custom-formats.ts. */
	customFormats?: unknown;
	/** Field `extensions` option: ids of the registered richtext extensions this field opted into. */
	extensions?: string[] | null;
	/** Field `extensionOptions` option: per-extension values, keyed by extension id. */
	extensionOptions?: unknown;
	/** Field `linkProtocols` option: extra URL schemes links and image links may use. */
	linkProtocols?: unknown;
	/** Field `keepLegacyEmphasisTags` option: keep `<b>` and `<i>` instead of rewriting them to `<strong>` and `<em>`. */
	keepLegacyEmphasisTags?: unknown;
	/** Field `noContainerParagraphs` option: never add `<p>` in list items, blockquotes and table cells. */
	noContainerParagraphs?: boolean;
	/** Field `allowWrapperElements` option: keep `div`, `aside`, `header`, `footer`, `nav` and `main` instead of unwrapping them. */
	allowWrapperElements?: unknown;
	comparisonMode?: boolean;
}

export interface FieldSchema {
	/** Per-field additions on top of `editorExtensions`, in the order every build site must use. */
	extensions: AnyExtension[];
	/** Tells this field's schema apart from others in the normalization verdict cache. */
	key: string;
	formats: CustomFormat[];
	linkProtocols: string[];
	buttons: RichTextToolbarButton[];
	bubbleMenus: RichTextBubbleMenu[];
}

/**
 * The one place a field's schema additions are assembled: the richtext extensions the field opted
 * into, its custom formats, its link protocols, its legacy emphasis tags, its wrapper elements, and the comparison-diff mark in
 * comparison mode. The live editor, the save-time round-trip check, the source-code drawer and the
 * comparison view all build from this result. A site that composed the list by hand could miss a contribution and report its markup as
 * dropped even though the editor renders it.
 */
export function buildFieldSchema(options: FieldSchemaOptions = {}): FieldSchema {
	const customFormats = buildCustomFormats(options.customFormats);
	const contributed = enabledRichTexts(options.extensions, options.extensionOptions);
	const links = buildLinkProtocolSchema(options.linkProtocols);
	const legacyEmphasis = buildLegacyEmphasisSchema(options.keepLegacyEmphasisTags);
	const wrappers = buildWrapperElementSchema(options.allowWrapperElements);
	const unwrapTags = [...(options.noContainerParagraphs ? LIST_CONTAINER_TAGS : []), ...wrappers.tags];

	return {
		extensions: [
			...contributed.flatMap((config) => config.extensions),
			...customFormats.extensions,
			...links.extensions,
			...legacyEmphasis.extensions,
			...wrappers.extensions,
			...(unwrapTags.length > 0 ? [NoContainerParagraphs.configure({ tags: unwrapTags })] : []),
			...(options.comparisonMode ? [ComparisonDiff] : []),
		],
		key: [
			options.comparisonMode ? 'comparison' : '',
			customFormats.key,
			links.key,
			legacyEmphasis.key,
			options.noContainerParagraphs ? 'no-container-paragraphs' : '',
			wrappers.key,
			contributed.map((config) => config.key).join('\u0000'),
		].join('\u0000'),
		formats: customFormats.formats,
		linkProtocols: links.protocols,
		buttons: contributed.flatMap((config) =>
			config.buttons.map((button) => ({ ...button, key: contributedKey(config, button) })),
		),
		bubbleMenus: contributed.flatMap((config) =>
			config.bubbleMenus.map((menu) => ({ ...menu, key: contributedKey(config, menu) })),
		),
	};
}
