import { Extension } from '@tiptap/vue-3';

/**
 * Inline `<code>` Enter behavior (CMS-2645), ported from the legacy `useInlineCode.ts`.
 *
 * Code block (`<pre>`) triple-enter exit and backspace-removes-empty-block come from StarterKit's
 * CodeBlock (its `exitOnTripleEnter` option and Backspace shortcut already match the old `usePre.ts`
 * semantics), so they need no custom keymap. The one gap is inline code: ProseMirror keeps stored
 * marks across the paragraph split, so Enter at the end of an inline `<code>` span carries the mark
 * into the new paragraph and the next line is still code. This drops the mark after the split, so
 * the new line is plain text — matching the legacy editor.
 *
 * Priority is raised so this runs before the default Enter (splitBlock) and owns the split itself.
 */
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
