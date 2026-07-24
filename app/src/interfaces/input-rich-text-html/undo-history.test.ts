import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';

/**
 * Programmatic value syncs must not be undoable — without `addToHistory: false` the initial
 * `setContent` lands in the undo stack and undo wipes the loaded content. These tests mirror the
 * exact commands the component runs on its value-sync path.
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
