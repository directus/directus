import { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { editorExtensions } from '../../editor-extensions';
import { applyStyle, readStyle } from './text-style';

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello world</p>' });
	// select the whole paragraph text so marks apply to a non-empty range
	editor.commands.selectAll();
});

afterEach(() => editor.destroy());

describe('applyStyle / readStyle', () => {
	test.each([
		['fontFamily', 'Arial, Helvetica, sans-serif', 'font-family'] as const,
		['fontSize', '24px', 'font-size'] as const,
		['color', '#ff0000', 'color:'] as const,
		['backgroundColor', '#ffff00', 'background-color'] as const,
	])('sets and reads %s', (attr, value, htmlNeedle) => {
		applyStyle(editor, attr, value);
		expect(readStyle(editor, attr)).toBe(value);
		expect(editor.getHTML()).toContain(htmlNeedle);
	});

	test.each([
		['fontFamily', 'Arial, Helvetica, sans-serif'] as const,
		['fontSize', '24px'] as const,
		['color', '#ff0000'] as const,
		['backgroundColor', '#ffff00'] as const,
	])('unsets %s when value is null', (attr, value) => {
		applyStyle(editor, attr, value);
		expect(readStyle(editor, attr)).toBe(value);
		applyStyle(editor, attr, null);
		expect(readStyle(editor, attr)).toBeNull();
	});

	test('readStyle returns null when no textStyle mark is present', () => {
		expect(readStyle(editor, 'color')).toBeNull();
	});
});
