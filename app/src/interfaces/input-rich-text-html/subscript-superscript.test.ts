import { Editor } from '@tiptap/vue-3';
import { beforeEach, describe, expect, test } from 'vitest';
import { editorExtensions } from './extensions';

/**
 * Drives the same toggleSubscript/toggleSuperscript commands the toolbar runs against the shared
 * extension set, guarding the schema-level `excludes` mutual exclusion (matching TinyMCE).
 */
let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>text</p>' });
	editor.commands.selectAll();
});

describe('subscript / superscript commands', () => {
	test('toggleSubscript applies and removes the sub mark', () => {
		editor.commands.toggleSubscript();
		expect(editor.isActive('subscript')).toBe(true);
		expect(editor.getHTML()).toContain('<sub>');

		editor.commands.toggleSubscript();
		expect(editor.isActive('subscript')).toBe(false);
		expect(editor.getHTML()).not.toContain('<sub>');
	});

	test('toggleSuperscript applies and removes the sup mark', () => {
		editor.commands.toggleSuperscript();
		expect(editor.isActive('superscript')).toBe(true);
		expect(editor.getHTML()).toContain('<sup>');

		editor.commands.toggleSuperscript();
		expect(editor.isActive('superscript')).toBe(false);
		expect(editor.getHTML()).not.toContain('<sup>');
	});

	test('applying superscript removes an existing subscript on the same selection', () => {
		editor.commands.toggleSubscript();
		editor.commands.toggleSuperscript();

		expect(editor.isActive('superscript')).toBe(true);
		expect(editor.isActive('subscript')).toBe(false);

		const html = editor.getHTML();
		expect(html).toContain('<sup>');
		expect(html).not.toContain('<sub>');
	});

	test('applying subscript removes an existing superscript on the same selection', () => {
		editor.commands.toggleSuperscript();
		editor.commands.toggleSubscript();

		expect(editor.isActive('subscript')).toBe(true);
		expect(editor.isActive('superscript')).toBe(false);

		const html = editor.getHTML();
		expect(html).toContain('<sub>');
		expect(html).not.toContain('<sup>');
	});
});
