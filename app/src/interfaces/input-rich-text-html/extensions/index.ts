import { CharacterCount } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import type { AnyExtension } from '@tiptap/vue-3';
import { Direction } from './direction';
import { DropCursor } from './drop-cursor';
import { figureExtensions } from './figure';
import { CustomImage } from './image';
import { BaseLink } from './link-protocols';
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

/**
 * The editor's extension set, shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift.
 */
export const editorExtensions = [
	StarterKit.configure({
		// replaced by DropCursor, which draws a vertical indicator between same-row inline-block nodes
		dropcursor: false,
		// standalone so buildLinkProtocols can swap it for a per-field configured Link
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

/** `editorExtensions` plus per-instance ones; an extra with a base extension's name replaces it in place. */
export function mergeEditorExtensions(extra: AnyExtension[]): AnyExtension[] {
	const byName = new Map(extra.map((extension) => [extension.name, extension]));
	const merged = editorExtensions.map((extension) => byName.get(extension.name) ?? extension);
	return [...merged, ...extra.filter((extension) => !merged.includes(extension))];
}
