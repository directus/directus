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
	extensions?: AnyExtension[];
	buttons?: RichTextToolbarButton[];
}
