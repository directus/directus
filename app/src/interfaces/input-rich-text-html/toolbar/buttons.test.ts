import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { editorExtensions } from '../extensions';
import { toolbarButtons } from './buttons';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function editorWithSelectedImage(content: string): Editor {
	const editor = new Editor({ extensions: editorExtensions, content });
	editors.push(editor);

	let imagePos = -1;

	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'image') imagePos = pos;
	});

	editor.commands.setNodeSelection(imagePos);
	return editor;
}

// the toolbar context is only needed for buttons that open drawers; these tests exercise editor-only paths
const ctx = {} as Parameters<NonNullable<(typeof toolbarButtons)['customLink']['command']>>[1];

describe('link buttons on a selected image', () => {
	const LINKED = '<a href="https://directus.io"><img src="/assets/abc" alt="a"></a><p>y</p>';
	const UNLINKED = '<img src="/assets/abc" alt="a"><p>y</p>';

	test('link button is active on a linked image and inactive on a plain image', () => {
		expect(toolbarButtons.customLink!.isActive!(editorWithSelectedImage(LINKED), ctx)).toBe(true);
		expect(toolbarButtons.customLink!.isActive!(editorWithSelectedImage(UNLINKED), ctx)).toBe(false);
	});

	test('unlink button is enabled only on a linked image', () => {
		expect(toolbarButtons.unlink!.disabled!(editorWithSelectedImage(LINKED))).toBe(false);
		expect(toolbarButtons.unlink!.disabled!(editorWithSelectedImage(UNLINKED))).toBe(true);
	});

	test('unlink button removes the anchor around the image', () => {
		const editor = editorWithSelectedImage(LINKED);

		toolbarButtons.unlink!.command!(editor, ctx);

		expect(editor.getHTML()).toBe(UNLINKED);
	});
});

describe('font-family toolbar button', () => {
	// The revert-to-default entry (value null → unsetFontFamily) must be the first item so users can
	// clear a custom font and fall back to the editor's base font.
	test('exposes a Default (null) revert entry first', () => {
		const items = toolbarButtons.fontfamily!.componentProps!.items as { label: string; value: string | null }[];
		expect(items[0]).toEqual({ label: 'wysiwyg_options.default', value: null });
	});
});
