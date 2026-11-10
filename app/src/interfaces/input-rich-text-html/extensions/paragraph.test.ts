import { Node } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { fieldEditorExtensions } from './index';

const Box = Node.create({
	name: 'box',
	group: 'block',
	content: 'inline*',
	parseHTML: () => [{ tag: 'x-box' }],
	renderHTML: () => ['x-box', 0],
});

function roundTrip(html: string): string {
	const editor = new Editor({ extensions: fieldEditorExtensions([Box]), content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

describe('CustomParagraph', () => {
	test('a div wrapping a contributed block node is unwrapped', () => {
		expect(roundTrip('<div class="x">a<x-box>b</x-box>c</div>')).toBe('<p>a</p><x-box>b</x-box><p>c</p>');
	});

	test('a div with inline content still becomes a paragraph next to contributed nodes', () => {
		expect(roundTrip('<div class="x">a</div><x-box>b</x-box>')).toBe('<p class="x">a</p><x-box>b</x-box>');
	});
});
