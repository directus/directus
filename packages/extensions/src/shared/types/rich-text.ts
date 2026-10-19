import type { AnyExtension, Editor } from '@tiptap/core';

interface RichTextButtonBase {
	/** A field switches the button on with `<extension id>:<key>` in its `toolbar` option. */
	key: string;
	icon: string;
	/**
	 * Plain text, or `$t:<key>` to show the translation of a key an admin adds in Settings → Translations,
	 * like the name of an interface or display. The extension cannot ship its own translations, and a key
	 * with no translation shows as the bare key.
	 */
	label: string;
	isActive?: (editor: Editor) => boolean;
	/** Can only add disabled cases: a locked or disabled field disables the button anyway. */
	isDisabled?: (editor: Editor) => boolean;
}

export interface RichTextCommandButton extends RichTextButtonBase {
	command: (editor: Editor) => void;
	items?: never;
}

export interface RichTextMenuItem {
	/** Unique inside the button. */
	key: string;
	/** Plain text or `$t:<key>`, like the button label. */
	label: string;
	icon?: string;
	command: (editor: Editor) => void;
	isActive?: (editor: Editor) => boolean;
	isDisabled?: (editor: Editor) => boolean;
}

/** Opens a dropdown, like the core table button. Without `isActive`, it is active when one of its items is. */
export interface RichTextMenuButton extends RichTextButtonBase {
	items: RichTextMenuItem[];
	command?: never;
}

export type RichTextToolbarButton = RichTextCommandButton | RichTextMenuButton;

export interface RichTextBubbleMenu {
	/** Unique inside the extension. */
	key: string;
	/**
	 * The app hides the menu anyway while the editor is not editable or the cursor is in a table. When
	 * several menus match, the first one in registration order shows.
	 */
	shouldShow: (editor: Editor) => boolean;
	/** Click buttons only: a dropdown opened from a bubble menu closes it when the editor loses focus. */
	buttons: RichTextCommandButton[];
}

export interface RichTextConfig {
	id: string;
	/** Plain text or `$t:<key>`, like the button label. */
	name: string;
	/**
	 * Every node and mark must be symmetric: `parseHTML` must read back exactly the markup
	 * `renderHTML` writes, with a high enough `priority` that no core rule claims it first. If not,
	 * every save of a field that enables the extension warns the user that saving alters the content.
	 * The app checks each node and mark once at load and logs a console warning on a mismatch.
	 */
	extensions?: AnyExtension[];
	buttons?: RichTextToolbarButton[];
	/** On for every field that enables the extension. It needs no `toolbar` key. */
	bubbleMenus?: RichTextBubbleMenu[];
}
