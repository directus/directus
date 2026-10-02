import type { AnyExtension, Editor } from '@tiptap/core';

export interface RichTextToolbarButton {
	/** A field switches the button on with `<extension id>:<key>` in its `toolbar` option. */
	key: string;
	icon: string;
	/** Plain text, not an i18n key: extensions cannot reach the app's i18n instance. */
	label: string;
	command: (editor: Editor) => void;
	isActive?: (editor: Editor) => boolean;
}

export interface RichTextConfig {
	id: string;
	name: string;
	/**
	 * Every node and mark must be symmetric: `parseHTML` must read back exactly the markup
	 * `renderHTML` writes, with a high enough `priority` that no core rule claims it first. If not,
	 * every save of a field that enables the extension warns the user that saving alters the content.
	 * The app checks each node and mark once at load and logs a console warning on a mismatch.
	 */
	extensions?: AnyExtension[];
	buttons?: RichTextToolbarButton[];
}
