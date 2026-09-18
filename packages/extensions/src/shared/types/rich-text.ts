import type { AnyExtension, Editor } from '@tiptap/core';

export interface RichTextToolbarButton {
	/** Also the value a field puts in its `toolbar` option to switch this button on. */
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
	 * Tiptap extensions built with `@tiptap/core`, which the app serves as a shared dependency so the
	 * extension bundle resolves to the app's copy. The app shares these instances across every editor
	 * it builds, the same way it shares its own extension list.
	 */
	extensions?: AnyExtension[];
	buttons?: RichTextToolbarButton[];
}
