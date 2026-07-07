import type { Editor } from '@tiptap/vue-3';
import type { Component } from 'vue';
import ColorMenu from './menus/color-menu.vue';
import StyleListMenu from './menus/style-list-menu.vue';
import TableMenu from './menus/table-menu.vue';

/** Handlers for buttons whose commands need more than the editor (instantiated in setup scope). */
export interface ToolbarContext {
	clipboard: {
		copy: (editor: Editor) => void;
		cut: (editor: Editor) => void;
		paste: (editor: Editor) => void;
	};
	fullscreen: {
		active: () => boolean;
		toggle: () => void;
	};
	visualaid: {
		active: () => boolean;
		toggle: () => void;
	};
	image: {
		open: () => void;
	};
	link: {
		open: () => void;
	};
}

export interface ToolbarButton {
	icon: string;
	/** i18n key, resolved with `t()` at render time */
	label: string;
	/** Click-command buttons set this. Menu buttons (`component`) omit it. */
	command?: (editor: Editor, ctx: ToolbarContext) => void;
	isActive?: (editor: Editor, ctx: ToolbarContext) => boolean;
	disabled?: (editor: Editor) => boolean;
	/** When set, the toolbar renders this dropdown component instead of a click button. */
	component?: Component;
	/** Extra props passed to `component` (e.g. picker config). */
	componentProps?: Record<string, unknown>;
	/** Layout width in px; defaults to the square icon-button width. Set for labeled dropdowns. */
	width?: number;
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

// Mirrors TinyMCE's default `font_family_formats` so existing content maps to the same names.
const FONT_FAMILIES: { label: string; value: string | null }[] = [
	{ label: 'Andale Mono', value: "'Andale Mono', monospace" },
	{ label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
	{ label: 'Arial Black', value: "'Arial Black', sans-serif" },
	{ label: 'Book Antiqua', value: "'Book Antiqua', Palatino, serif" },
	{ label: 'Comic Sans MS', value: "'Comic Sans MS', sans-serif" },
	{ label: 'Courier New', value: "'Courier New', Courier, monospace" },
	{ label: 'Georgia', value: 'Georgia, Palatino, serif' },
	{ label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
	{ label: 'Impact', value: 'Impact, sans-serif' },
	{ label: 'Symbol', value: 'Symbol' },
	{ label: 'Tahoma', value: 'Tahoma, Arial, Helvetica, sans-serif' },
	{ label: 'Terminal', value: 'Terminal, Monaco, monospace' },
	{ label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
	{ label: 'Trebuchet MS', value: "'Trebuchet MS', Geneva, sans-serif" },
	{ label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
	{ label: 'Webdings', value: 'Webdings' },
	{ label: 'Wingdings', value: "'Wingdings', 'Zapf Dingbats'" },
];

const FONT_SIZES: { label: string; value: string | null }[] = [12, 14, 16, 18, 24, 30, 36, 48].map((px) => ({
	label: String(px),
	value: `${px}px`,
}));

// Labeled dropdowns are wider than icon buttons; the layout needs the real width to avoid clipping.
const FONT_FAMILY_WIDTH = 132;
const FONT_SIZE_WIDTH = 80;

// Icon + caret dropdowns (color pickers) are wider than a plain icon button; keep in sync with the
// `2.5rem` activator width in color-menu.vue and `popoverWidth` in toolbar.vue.
const CARET_BUTTON_WIDTH = 40;

// text-align directions; `alignnone` (unset) is registered separately below
const align: Record<string, ToolbarButton> = Object.fromEntries(
	(['left', 'center', 'right', 'justify'] as const).map((value) => [
		`align${value}`,
		{
			icon: `format_align_${value}`,
			label: `wysiwyg_options.align${value}`,
			command: (e: Editor) => e.chain().focus().setTextAlign(value).run(),
			isActive: (e: Editor) => e.isActive({ textAlign: value }),
		} satisfies ToolbarButton,
	]),
);

// text direction; rendered as a popover group, sets a `dir` attribute on the current block(s)
const direction: Record<string, ToolbarButton> = Object.fromEntries(
	(['ltr', 'rtl'] as const).map((value) => [
		value,
		{
			icon: value === 'ltr' ? 'format_textdirection_l_to_r' : 'format_textdirection_r_to_l',
			label: `wysiwyg_options.${value}`,
			command: (e: Editor) => e.chain().focus().setDirection(value).run(),
			isActive: (e: Editor) => e.isActive({ dir: value }),
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
	fontfamily: {
		icon: 'font_download',
		label: 'wysiwyg_options.fontselect',
		component: StyleListMenu,
		width: FONT_FAMILY_WIDTH,
		componentProps: {
			label: 'wysiwyg_options.fontselect',
			attr: 'fontFamily',
			items: FONT_FAMILIES,
			width: FONT_FAMILY_WIDTH,
			previewFont: true,
		},
	},
	fontsize: {
		icon: 'format_size',
		label: 'wysiwyg_options.fontsizeselect',
		component: StyleListMenu,
		width: FONT_SIZE_WIDTH,
		componentProps: {
			label: 'wysiwyg_options.fontsizeselect',
			attr: 'fontSize',
			items: FONT_SIZES,
			width: FONT_SIZE_WIDTH,
		},
	},
	forecolor: {
		icon: 'format_color_text',
		label: 'wysiwyg_options.forecolor',
		component: ColorMenu,
		width: CARET_BUTTON_WIDTH,
		componentProps: { icon: 'format_color_text', label: 'wysiwyg_options.forecolor', mode: 'text' },
	},
	backcolor: {
		icon: 'format_color_fill',
		label: 'wysiwyg_options.backcolor',
		component: ColorMenu,
		width: CARET_BUTTON_WIDTH,
		componentProps: { icon: 'format_color_fill', label: 'wysiwyg_options.backcolor', mode: 'background' },
	},
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
	...align,
	alignnone: {
		icon: 'format_clear',
		label: 'wysiwyg_options.alignnone',
		command: (e) => e.chain().focus().unsetTextAlign().run(),
	},
	...direction,
	subscript: {
		icon: 'subscript',
		label: 'wysiwyg_options.subscript',
		command: (e) => e.chain().focus().toggleSubscript().run(),
		isActive: (e) => e.isActive('subscript'),
	},
	superscript: {
		icon: 'superscript',
		label: 'wysiwyg_options.superscript',
		command: (e) => e.chain().focus().toggleSuperscript().run(),
		isActive: (e) => e.isActive('superscript'),
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
	customInlineCode: {
		icon: 'code',
		label: 'wysiwyg_options.codeblock',
		command: (e) => e.chain().focus().toggleCode().run(),
		isActive: (e) => e.isActive('code'),
	},
	customPre: {
		icon: 'code_blocks',
		label: 'wysiwyg_options.pre',
		command: (e) => e.chain().focus().toggleCodeBlock().run(),
		isActive: (e) => e.isActive('codeBlock'),
	},
	customLink: {
		icon: 'link',
		label: 'wysiwyg_options.link',
		command: (_e, ctx) => ctx.link.open(),
		isActive: (e) => e.isActive('link'),
	},
	unlink: {
		icon: 'link_off',
		label: 'wysiwyg_options.unlink',
		command: (e) => e.chain().focus().extendMarkRange('link').unsetLink().run(),
		disabled: (e) => !e.isActive('link'),
	},
	customImage: {
		icon: 'image',
		label: 'wysiwyg_options.image',
		command: (_e, ctx) => ctx.image.open(),
		isActive: (e) => e.isActive('image'),
	},
	hr: {
		icon: 'horizontal_rule',
		label: 'wysiwyg_options.hr',
		command: (e) => e.chain().focus().setHorizontalRule().run(),
	},
	removeformat: {
		icon: 'format_clear',
		label: 'wysiwyg_options.removeformat',
		command: (e) => e.chain().focus().unsetAllMarks().clearNodes().unsetDirection().run(),
	},
	cut: {
		icon: 'content_cut',
		label: 'wysiwyg_options.cut',
		command: (e, ctx) => ctx.clipboard.cut(e),
		disabled: (e) => e.state.selection.empty,
	},
	copy: {
		icon: 'content_copy',
		label: 'wysiwyg_options.copy',
		command: (e, ctx) => ctx.clipboard.copy(e),
		disabled: (e) => e.state.selection.empty,
	},
	paste: {
		icon: 'content_paste',
		label: 'wysiwyg_options.paste',
		command: (e, ctx) => ctx.clipboard.paste(e),
	},
	remove: {
		icon: 'delete',
		label: 'wysiwyg_options.remove',
		command: (e) => e.chain().focus().deleteSelection().run(),
		disabled: (e) => e.state.selection.empty,
	},
	selectall: {
		icon: 'select_all',
		label: 'wysiwyg_options.selectall',
		command: (e) => e.chain().focus().selectAll().run(),
	},
	table: {
		icon: 'table',
		label: 'wysiwyg_options.table',
		component: TableMenu,
		// wider than a square button: it carries a dropdown caret (see toolbar-popover's popoverWidth)
		width: 40,
	},
	visualaid: {
		icon: 'border_clear',
		label: 'wysiwyg_options.visualaid',
		command: (_e, ctx) => ctx.visualaid.toggle(),
		isActive: (_e, ctx) => ctx.visualaid.active(),
	},
	fullscreen: {
		icon: 'zoom_out_map',
		label: 'wysiwyg_options.fullscreen',
		command: (_e, ctx) => ctx.fullscreen.toggle(),
		isActive: (_e, ctx) => ctx.fullscreen.active(),
	},
};
