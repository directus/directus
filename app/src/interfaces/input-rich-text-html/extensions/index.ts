import type { RichTextBubbleMenu, RichTextToolbarButton } from '@directus/extensions';
import type { AnyExtension } from '@tiptap/core';
import { CharacterCount } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { ComparisonDiff } from './comparison-diff';
import { buildCustomFormats, type CustomFormat } from './custom-formats';
import { Direction } from './direction';
import { DropCursor } from './drop-cursor';
import { figureExtensions } from './figure';
import { CustomImage } from './image';
import { BaseLink, buildLinkProtocolSchema } from './link-protocols';
import { Media } from './media';
import { PageBreak } from './page-break';
import { PreKeymap } from './pre-keymap';
import { PreservedAttributes, styleRules } from './preserved-attributes';
import { RangeSelectedAtoms } from './range-selected-atoms';
import { semanticHtml } from './semantic-html';
import { StyleTag } from './style-tag';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { Table } from './table';
import { TextAlignment } from './text-alignment';
import { PreservingTextStyle, TextStyle } from './text-style';
import { contributedKey, enabledRichTexts } from '@/rich-text/register';

/**
 * The editor's extension set, shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift.
 */
export const editorExtensions = [
	StarterKit.configure({
		// replaced by DropCursor, which draws a vertical indicator between same-row inline-block nodes
		dropcursor: false,
		// standalone so buildLinkProtocolSchema can swap it for a per-field configured Link
		link: false,
	}),
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
	const isPreserved = (extension: AnyExtension) => extension.name === PreservedAttributes.name;
	const others = [...base.filter((extension) => !isPreserved(extension)), ...appended];

	const isInlineTextStyle = (extension: AnyExtension) =>
		extension.name === PreservingTextStyle.name && extension.options.inlineStyles;

	return [
		...base.map((extension) => {
			if (isPreserved(extension)) return extension.configure({ extensions: others });
			if (isInlineTextStyle(extension)) return extension.configure({ styleRules: styleRules(others) });
			return extension;
		}),
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
	/** Field `keepInlineStyles` option: keep every `style` attribute and `<style>` tag. */
	keepInlineStyles?: boolean;
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
 * into, its custom formats, its link protocols, and the comparison-diff mark in comparison mode. The
 * live editor, the save-time round-trip check, the source-code drawer and the comparison view all
 * build from this result. A site that composed the list by hand could miss a contribution and report its markup as
 * dropped even though the editor renders it.
 */
export function buildFieldSchema(options: FieldSchemaOptions = {}): FieldSchema {
	const customFormats = buildCustomFormats(options.customFormats);
	const contributed = enabledRichTexts(options.extensions, options.extensionOptions);
	const links = buildLinkProtocolSchema(options.linkProtocols);

	return {
		extensions: [
			...contributed.flatMap((config) => config.extensions),
			...customFormats.extensions,
			...links.extensions,
			...(options.keepInlineStyles
				? [
						PreservedAttributes.configure({ inlineStyles: true }),
						PreservingTextStyle.configure({ inlineStyles: true }),
						StyleTag,
					]
				: []),
			...(options.comparisonMode ? [ComparisonDiff] : []),
		],
		key: [
			options.comparisonMode ? 'comparison' : '',
			options.keepInlineStyles ? 'inline-styles' : '',
			customFormats.key,
			links.key,
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
