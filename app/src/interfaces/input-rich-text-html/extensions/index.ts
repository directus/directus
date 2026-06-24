import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './image';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { TextAlignment } from './text-alignment';
import { TextStyle } from './text-style';

/**
 * The editor's extension set. Shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift — the schema here is the single source of truth for what HTML round-trips.
 *
 * Link (CMS-2642) comes from StarterKit. Its defaults force `target="_blank"` and a `rel` on every
 * link, which would rewrite same-tab links on round-trip; nulling those HTMLAttributes lets `target`
 * and `rel` parse from the source instead. `defaultProtocol` matches the legacy TinyMCE setting.
 */
export const editorExtensions = [
	StarterKit.configure({
		link: {
			defaultProtocol: 'https',
			openOnClick: false,
			HTMLAttributes: { target: null, rel: null },
		},
	}),
	CustomImage,
	TextAlignment,
	CustomSubscript,
	CustomSuperscript,
	TextStyle,
];
