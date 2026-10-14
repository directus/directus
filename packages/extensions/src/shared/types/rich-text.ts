import type { AppField, DeepPartial } from '@directus/types';
import type { AnyExtension, Editor } from '@tiptap/core';

interface RichTextButtonBase {
	/** A field switches the button on with `<extension id>:<key>` in its `toolbar` option. */
	key: string;
	icon: string;
	/** Plain text, not an i18n key: extensions cannot reach the app's i18n instance. */
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
	/** Plain text, like the button label. */
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

/** A field's values for the extension's `options`, over each option's `schema.default_value`. */
export type RichTextOptionValues = Record<string, any>;

/** A fixed list, or one built from the option values of the field the editor is for. */
export type RichTextPerField<T, Options extends RichTextOptionValues> = T[] | ((options: Options) => T[]);

export interface RichTextConfig<Options extends RichTextOptionValues = RichTextOptionValues> {
	id: string;
	name: string;
	/** Per-field settings, stored under the field's `extensionOptions.<id>` and passed to the factories. */
	options?: DeepPartial<AppField>[];
	/**
	 * Every node and mark must be symmetric: `parseHTML` must read back exactly the markup
	 * `renderHTML` writes, with a high enough `priority` that no core rule claims it first. If not,
	 * every save of a field that enables the extension warns the user that saving alters the content.
	 * The app checks each node and mark once at load, with the default option values.
	 *
	 * A factory must return the same names for every option value, or content saved under one value
	 * stops parsing under another. A field whose values break this loads without the extension.
	 */
	extensions?: RichTextPerField<AnyExtension, Options>;
	buttons?: RichTextPerField<RichTextToolbarButton, Options>;
	/** On for every field that enables the extension. It needs no `toolbar` key. */
	bubbleMenus?: RichTextPerField<RichTextBubbleMenu, Options>;
}
