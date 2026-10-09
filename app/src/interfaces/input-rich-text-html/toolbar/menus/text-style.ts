import type { Editor } from '@tiptap/vue-3';

/** textStyle attributes managed by the font/color toolbar menus. */
export type StyleAttr = 'fontFamily' | 'fontSize' | 'color' | 'backgroundColor';

/** Apply a textStyle attribute to the selection; `null` removes it. Always refocuses the editor. */
export function applyStyle(editor: Editor, attr: StyleAttr, value: string | null): void {
	const chain = editor.chain().focus();

	switch (attr) {
		case 'fontFamily':
			(value === null ? chain.unsetFontFamily() : chain.setFontFamily(value)).run();
			break;
		case 'fontSize':
			(value === null ? chain.unsetFontSize() : chain.setFontSize(value)).run();
			break;
		case 'color':
			(value === null ? chain.unsetColor() : chain.setColor(value)).run();
			break;
		case 'backgroundColor':
			(value === null ? chain.unsetBackgroundColor() : chain.setBackgroundColor(value)).run();
			break;
	}
}

/** Read the textStyle attribute currently applied to the selection, or `null` if unset. */
export function readStyle(editor: Editor, attr: StyleAttr): string | null {
	return (editor.getAttributes('textStyle')[attr] as string | undefined) ?? null;
}
