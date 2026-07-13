import { CharacterCount } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Direction } from './direction';
import { DropCursor } from './drop-cursor';
import { CustomImage } from './image';
import { Media } from './media';
import { PageBreak } from './page-break';
import { PreKeymap } from './pre-keymap';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { Table } from './table';
import { TextAlignment } from './text-alignment';
import { TextStyle } from './text-style';

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
	TextStyle,
	PageBreak,
	Table,
	PreKeymap,
	CharacterCount,
];
