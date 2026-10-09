import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/** Marks a leaf node the selection covers; styled with the same outline as `ProseMirror-selectednode`. */
export const RANGE_SELECTED_CLASS = 'range-selected';

/**
 * ProseMirror only sets `ProseMirror-selectednode` for a NodeSelection, so leaves like `<img>` and
 * `<hr>` render as untouched under a range selection that covers them (select-all, shift+arrow, a
 * drag past them) even though they would be deleted. Media nodes escape this because tiptap's Vue
 * node view marks itself selected whenever the selection covers it (`isNodeViewSelected`); this
 * decoration gives the node-view-less leaves the same feedback so a mixed selection is legible.
 */
export const RangeSelectedAtoms = Extension.create({
	name: 'rangeSelectedAtoms',

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					decorations(state) {
						const { selection } = state;
						if (selection.empty) return null;

						const { from, to } = selection;
						const decorations: Decoration[] = [];

						state.doc.nodesBetween(from, to, (node, pos) => {
							// text leaves already carry the browser's own selection highlight
							if (!node.isLeaf || node.isText) return;

							// same rule as tiptap's isNodeViewSelected, so media and leaves agree
							if (from <= pos && to >= pos + node.nodeSize) {
								decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: RANGE_SELECTED_CLASS }));
							}
						});

						return decorations.length ? DecorationSet.create(state.doc, decorations) : null;
					},
				},
			}),
		];
	},
});
