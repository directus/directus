import type { RichTextToolbarButton } from '@directus/extensions';
import type { AnyExtension } from '@tiptap/core';
import { CharacterCount } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { ComparisonDiff } from './comparison-diff';
import { buildCustomFormats, type CustomFormat } from './custom-formats';
import { Direction } from './direction';
import { DropCursor } from './drop-cursor';
import { figureExtensions } from './figure';
import { CustomImage } from './image';
import { Media } from './media';
import { PageBreak } from './page-break';
import { PreKeymap } from './pre-keymap';
import { PreservedAttributes } from './preserved-attributes';
import { RangeSelectedAtoms } from './range-selected-atoms';
import { semanticHtml } from './semantic-html';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { Table } from './table';
import { TextAlignment } from './text-alignment';
import { TextStyle } from './text-style';
import { contributedButtonKey, enabledRichTexts } from '@/rich-text/register';

/**
 * The editor's extension set, shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift. Link's default HTMLAttributes force `target="_blank"`/`rel` on every link, which
 * would rewrite same-tab links on round-trip — nulling them lets both parse from the source.
 */
export const editorExtensions = [
	StarterKit.configure({
		// replaced by DropCursor, which draws a vertical indicator between same-row inline-block nodes
		dropcursor: false,
		link: {
			defaultProtocol: 'https',
			openOnClick: false,
			HTMLAttributes: { target: null, rel: null },
		},
	}),
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

export interface FieldSchemaOptions {
	/** Field `customFormats` option (array or JSON string); see custom-formats.ts. */
	customFormats?: unknown;
	/** Field `extensions` option: ids of the registered richtext extensions this field opted into. */
	extensions?: string[] | null;
	comparisonMode?: boolean;
}

export interface FieldSchema {
	/** Per-field additions on top of `editorExtensions`, in the order every build site must use. */
	extensions: AnyExtension[];
	/** Tells this field's schema apart from others in the normalization verdict cache. */
	key: string;
	formats: CustomFormat[];
	buttons: RichTextToolbarButton[];
}

/**
 * The one place a field's schema additions are assembled: the richtext extensions the field opted
 * into, its custom formats, and the comparison-diff mark in comparison mode. The live editor, the
 * save-time round-trip check, the source-code drawer and the comparison view all build from this
 * result. A site that composed the list by hand could miss a contribution and report its markup as
 * dropped even though the editor renders it.
 */
export function buildFieldSchema(options: FieldSchemaOptions = {}): FieldSchema {
	const customFormats = buildCustomFormats(options.customFormats);
	const contributed = enabledRichTexts(options.extensions);

	return {
		extensions: [
			...contributed.flatMap((config) => config.extensions ?? []),
			...customFormats.extensions,
			...(options.comparisonMode ? [ComparisonDiff] : []),
		],
		key: [
			options.comparisonMode ? 'comparison' : '',
			customFormats.key,
			contributed.map((config) => config.id).join('\u0000'),
		].join('\u0000'),
		formats: customFormats.formats,
		buttons: contributed.flatMap(
			(config) => config.buttons?.map((button) => ({ ...button, key: contributedButtonKey(config, button) })) ?? [],
		),
	};
}
