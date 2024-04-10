const MAP = {
	undo: 'undo',
	redo: 'redo',
	bold: 'format_bold',
	italic: 'format_italic',
	underline: 'format_underlined',
	'strike-through': 'strikethrough_s',
	subscript: 'subscript',
	superscript: 'superscript',
	'remove-formatting': 'format_strikethrough',
	cut: 'cut',
	copy: 'content_copy',
	paste: 'content_paste',
	remove: 'delete',
	'select-all': 'select_all',
	quote: 'format_quote',
	link: 'link',
	unlink: 'link_off',
	image: 'image',
	embed: 'slideshow',
	'horizontal-rule': 'horizontal_rule',
	sourcecode: 'code',
	fullscreen: 'fullscreen',
	ltr: 'format_textdirection_l_to_r',
	rtl: 'format_textdirection_r_to_l',
	close: 'close',
	'color-picker': 'palette',
	'new-tab': 'open_in_new',
};

const icons = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [k, `<i data-icon="${v}" />`]));

// @ts-ignore
// eslint-disable-next-line no-undef
tinymce.IconManager.add('material', {
	icons,
});
