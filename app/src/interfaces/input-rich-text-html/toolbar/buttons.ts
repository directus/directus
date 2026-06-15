import type { Editor } from '@tiptap/vue-3';

export interface ToolbarButton {
	icon: string;
	/** i18n key, resolved with `t()` at render time */
	label: string;
	command: (editor: Editor) => void;
	isActive?: (editor: Editor) => boolean;
	disabled?: (editor: Editor) => boolean;
}

const headings: Record<string, ToolbarButton> = Object.fromEntries(
	([1, 2, 3, 4, 5, 6] as const).map((level) => [
		`h${level}`,
		{
			icon: `format_h${level}`,
			label: `wysiwyg_options.h${level}`,
			command: (e: Editor) => e.chain().focus().toggleHeading({ level }).run(),
			isActive: (e: Editor) => e.isActive('heading', { level }),
		} satisfies ToolbarButton,
	]),
);

/**
 * Toolbar registry keyed by the toolbar option values stored in field meta.
 * Keys not present here (legacy/unsupported) are ignored gracefully by the toolbar.
 */
export const toolbarButtons: Record<string, ToolbarButton> = {
	undo: {
		icon: 'undo',
		label: 'wysiwyg_options.undo',
		command: (e) => e.chain().focus().undo().run(),
		disabled: (e) => !e.can().undo(),
	},
	redo: {
		icon: 'redo',
		label: 'wysiwyg_options.redo',
		command: (e) => e.chain().focus().redo().run(),
		disabled: (e) => !e.can().redo(),
	},
	...headings,
	bold: {
		icon: 'format_bold',
		label: 'wysiwyg_options.bold',
		command: (e) => e.chain().focus().toggleBold().run(),
		isActive: (e) => e.isActive('bold'),
	},
	italic: {
		icon: 'format_italic',
		label: 'wysiwyg_options.italic',
		command: (e) => e.chain().focus().toggleItalic().run(),
		isActive: (e) => e.isActive('italic'),
	},
	underline: {
		icon: 'format_underlined',
		label: 'wysiwyg_options.underline',
		command: (e) => e.chain().focus().toggleUnderline().run(),
		isActive: (e) => e.isActive('underline'),
	},
	strikethrough: {
		icon: 'strikethrough_s',
		label: 'wysiwyg_options.strikethrough',
		command: (e) => e.chain().focus().toggleStrike().run(),
		isActive: (e) => e.isActive('strike'),
	},
	numlist: {
		icon: 'format_list_numbered',
		label: 'wysiwyg_options.numlist',
		command: (e) => e.chain().focus().toggleOrderedList().run(),
		isActive: (e) => e.isActive('orderedList'),
	},
	bullist: {
		icon: 'format_list_bulleted',
		label: 'wysiwyg_options.bullist',
		command: (e) => e.chain().focus().toggleBulletList().run(),
		isActive: (e) => e.isActive('bulletList'),
	},
	// list-only indent/outdent (accepted behavior change vs TinyMCE, which indented any block)
	indent: {
		icon: 'format_indent_increase',
		label: 'wysiwyg_options.indent',
		command: (e) => e.chain().focus().sinkListItem('listItem').run(),
		disabled: (e) => !e.can().sinkListItem('listItem'),
	},
	outdent: {
		icon: 'format_indent_decrease',
		label: 'wysiwyg_options.outdent',
		command: (e) => e.chain().focus().liftListItem('listItem').run(),
		disabled: (e) => !e.can().liftListItem('listItem'),
	},
	blockquote: {
		icon: 'format_quote',
		label: 'wysiwyg_options.blockquote',
		command: (e) => e.chain().focus().toggleBlockquote().run(),
		isActive: (e) => e.isActive('blockquote'),
	},
	hr: {
		icon: 'horizontal_rule',
		label: 'wysiwyg_options.hr',
		command: (e) => e.chain().focus().setHorizontalRule().run(),
	},
	removeformat: {
		icon: 'format_clear',
		label: 'wysiwyg_options.removeformat',
		command: (e) => e.chain().focus().unsetAllMarks().clearNodes().run(),
	},
};
