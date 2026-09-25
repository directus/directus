import type { Editor } from '@tiptap/vue-3';

/** Selects the first node of `type` in the document and returns its position. */
export function selectNode(editor: Editor, type: string): number {
	let pos: number | undefined;

	editor.state.doc.descendants((node, nodePos) => {
		if (pos === undefined && node.type.name === type) pos = nodePos;
	});

	if (pos === undefined) throw new Error(`no ${type} node in the document`);

	editor.commands.setNodeSelection(pos);
	return pos;
}
