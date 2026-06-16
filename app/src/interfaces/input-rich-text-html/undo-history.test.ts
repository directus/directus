import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';

/**
 * Undo-history hygiene (CMS-2636 regression).
 *
 * The interface mounts the editor empty and syncs the field value in afterwards (async item
 * load, revert, version switch) via `setContent`. By default that transaction lands in the
 * ProseMirror undo stack, so undo is enabled before the user types anything — and pressing it
 * reverts the editor to empty, wiping the loaded content. Programmatic value syncs must NOT be
 * undoable; only the user's own edits should be.
 *
 * These tests mirror exactly the two commands the component runs (initial empty editor, then the
 * value-watcher's setContent), so they guard the `addToHistory: false` meta on that sync path.
 */
function freshEditor() {
	return new Editor({ extensions: [StarterKit], content: '' });
}

/** Mirrors the component's value-watcher: sync external value without polluting history. */
function syncValue(editor: Editor, value: string) {
	editor.chain().setMeta('addToHistory', false).setContent(value, { emitUpdate: false }).run();
}

describe('undo history', () => {
	test('programmatic value sync is not undoable', () => {
		const editor = freshEditor();

		syncValue(editor, '<p>loaded from the server</p>');

		expect(editor.can().undo()).toBe(false);
		expect(editor.getHTML()).toContain('loaded from the server');

		editor.destroy();
	});

	test('undo after a value sync does not wipe the synced content', () => {
		const editor = freshEditor();

		syncValue(editor, '<p>loaded from the server</p>');
		editor.commands.undo();

		expect(editor.getHTML()).toContain('loaded from the server');

		editor.destroy();
	});

	test("the user's own edits remain undoable", () => {
		const editor = freshEditor();

		syncValue(editor, '<p>loaded from the server</p>');
		editor.commands.insertContent(' — edited by the user');
		expect(editor.can().undo()).toBe(true);

		editor.commands.undo();
		expect(editor.getHTML()).not.toContain('edited by the user');
		expect(editor.getHTML()).toContain('loaded from the server');

		editor.destroy();
	});
});
