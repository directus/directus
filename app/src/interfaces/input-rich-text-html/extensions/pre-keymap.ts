import { Extension } from '@tiptap/vue-3';

// Enter after inline `<code>` drops the mark so the new line is plain text (ProseMirror otherwise carries stored marks across the split).
export const PreKeymap = Extension.create({
	name: 'preKeymap',
	priority: 1000,

	addKeyboardShortcuts() {
		return {
			Enter: () => {
				if (!this.editor.isActive('code')) return false;
				return this.editor.chain().splitBlock().unsetMark('code').run();
			},
		};
	},
});
