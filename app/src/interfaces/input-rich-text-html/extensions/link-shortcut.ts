import { Extension } from '@tiptap/vue-3';

export interface LinkShortcutOptions {
	/** Invoked on Mod-K; the component wires this to open the link drawer. */
	onTrigger: () => void;
}

/**
 * Binds Cmd/Ctrl+K to open the link drawer. Kept out of the shared `editorExtensions` set because
 * its callback is per-editor-instance — the component appends it configured with its own opener.
 * Keyboard shortcuts only fire while the editor is focused, satisfying the "focused only" requirement.
 */
export const LinkShortcut = Extension.create<LinkShortcutOptions>({
	name: 'linkShortcut',

	addOptions() {
		return { onTrigger: () => {} };
	},

	addKeyboardShortcuts() {
		return {
			'Mod-k': () => {
				this.options.onTrigger();
				return true;
			},
		};
	},
});
