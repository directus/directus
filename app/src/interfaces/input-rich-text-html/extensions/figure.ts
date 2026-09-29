import { Extension, findParentNode, Node } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { type EditorState, Plugin, type Selection, type Transaction } from '@tiptap/pm/state';
import { Mapping, ReplaceStep } from '@tiptap/pm/transform';

export const FIGURE_NODE = 'figure';

export const FIGCAPTION_NODE = 'figcaption';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		figure: {
			setFigure: () => ReturnType;
			unsetFigure: () => ReturnType;
			setFigureCaption: (text: string) => ReturnType;
			unsetFigureCaption: () => ReturnType;
		};
	}
}

/**
 * `<figure>` / `<figcaption>` with the commands the image drawer's caption field drives.
 *
 * The content expression is `(block | figcaption)+` rather than the spec's caption-first-or-last so
 * any authored order survives a round-trip. No toolbar button yet: wrapping arbitrary blocks is a
 * follow-up, and `setFigure`/`unsetFigure` are the seam it plugs into.
 */
export const Figure = Node.create({
	name: FIGURE_NODE,
	group: 'block',
	content: `(block | ${FIGCAPTION_NODE})+`,
	defining: true,

	parseHTML() {
		return [{ tag: 'figure' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['figure', HTMLAttributes, 0];
	},

	addCommands() {
		return {
			setFigure:
				() =>
				({ state, commands }) => {
					// nesting a figure inside a figure is never the intent
					if (findFigure(state.selection)) return true;
					return commands.wrapIn(this.name);
				},

			unsetFigure:
				() =>
				({ state, tr, dispatch }) => {
					const figure = findFigure(state.selection);
					if (!figure) return false;

					if (dispatch) replaceFigureWithContent(tr, state, figure, captionlessContent(figure.node));

					return true;
				},

			setFigureCaption:
				(text) =>
				({ chain, state }) => {
					const chained = chain();

					if (!findFigure(state.selection)) chained.setFigure();

					// `state` inside a chained command reflects the pending transaction, so the figure the
					// wrap above created is already visible here
					return chained
						.command(({ state, tr, dispatch }) => {
							const figure = findFigure(state.selection);
							if (!figure) return false;
							if (!dispatch) return true;

							const caption = findCaption(figure.node);
							const content = text ? Fragment.from(state.schema.text(text)) : Fragment.empty;

							if (caption) {
								// replace the text only, so the caption keeps its own class/id/data-* attributes
								const from = figure.pos + 1 + caption.offset + 1;
								tr.replaceWith(from, from + caption.node.content.size, content);
							} else {
								// a fresh caption goes last; an existing one keeps its authored position
								tr.insert(
									figure.pos + figure.node.nodeSize - 1,
									state.schema.nodes[FIGCAPTION_NODE]!.create(null, content),
								);
							}

							return true;
						})
						.run();
				},

			unsetFigureCaption:
				() =>
				({ state, tr, dispatch }) => {
					const figure = findFigure(state.selection);
					if (!figure) return false;

					const captions = findCaptions(figure.node);

					// nothing to clear: leave the figure alone rather than unwrapping a wrapper the author
					// created deliberately
					if (!captions.length) return false;

					const rest = captionlessContent(figure.node);

					// the wrapper is only dropped when it carries nothing of its own: a `<figure class="float-left">`
					// or a figure grouping non-image blocks outlives its caption
					const unwrap = !hasOwnAttributes(figure.node) && rest.length > 0 && rest.every(isImage);

					if (dispatch) {
						if (unwrap) {
							replaceFigureWithContent(tr, state, figure, rest);
						} else {
							// back to front so each deletion leaves the earlier positions valid
							for (const caption of [...captions].reverse()) {
								const from = figure.pos + 1 + caption.offset;
								tr.delete(from, from + caption.node.nodeSize);
							}
						}
					}

					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		return [orphanCaptionCleanup()];
	},
});

export const Figcaption = Node.create({
	name: FIGCAPTION_NODE,
	content: 'inline*',
	defining: true,

	parseHTML() {
		return [{ tag: 'figcaption' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['figcaption', HTMLAttributes, 0];
	},
});

/**
 * Enter/Backspace inside a caption. Without these, Enter splits the caption into a second
 * `<figcaption>` (which the content expression accepts but HTML doesn't) and Backspace in an empty
 * one joins it backwards into the image.
 */
export const FigureKeymap = Extension.create({
	name: 'figureKeymap',
	priority: 1000,

	addKeyboardShortcuts() {
		return {
			Enter: () => {
				const { state } = this.editor;
				if (!findParentNode(isCaptionNode)(state.selection)) return false;

				const figure = findFigure(state.selection);
				if (!figure) return false;

				// leave the figure entirely rather than growing it
				return this.editor.commands.insertContentAt(figure.pos + figure.node.nodeSize, { type: 'paragraph' });
			},

			Backspace: () => {
				const { state } = this.editor;
				if (!state.selection.empty) return false;

				const caption = findParentNode(isCaptionNode)(state.selection);
				if (!caption || caption.node.content.size > 0) return false;

				return this.editor.commands.unsetFigureCaption();
			},
		};
	},
});

export const figureExtensions = [Figure, Figcaption, FigureKeymap];

type FoundNode = { pos: number; node: ProseMirrorNode };

type FoundChild = { offset: number; node: ProseMirrorNode };

function isCaptionNode(node: ProseMirrorNode): boolean {
	return node.type.name === FIGCAPTION_NODE;
}

function isImage(node: ProseMirrorNode): boolean {
	return node.type.name === 'image';
}

/** The figure the selection sits in, if any. `pos` is the position before the figure node. */
export function findFigure(selection: Selection): FoundNode | undefined {
	const found = findParentNode((node) => node.type.name === FIGURE_NODE)(selection);
	return found ? { pos: found.pos, node: found.node } : undefined;
}

/** The figure's caption text, or `''` when it has no caption. */
export function getFigureCaption(figure: ProseMirrorNode): string {
	return findCaption(figure)?.node.textContent ?? '';
}

function findCaption(figure: ProseMirrorNode): FoundChild | undefined {
	return findCaptions(figure)[0];
}

function findCaptions(figure: ProseMirrorNode): FoundChild[] {
	const captions: FoundChild[] = [];

	figure.forEach((node, offset) => {
		if (isCaptionNode(node)) captions.push({ node, offset });
	});

	return captions;
}

function captionlessContent(figure: ProseMirrorNode): ProseMirrorNode[] {
	const kept: ProseMirrorNode[] = [];

	figure.forEach((node) => {
		if (!isCaptionNode(node)) kept.push(node);
	});

	return kept;
}

/** True when the figure carries any non-null attribute eg:(class, id, title, role, lang, dir, data-, aria-). */
function hasOwnAttributes(figure: ProseMirrorNode): boolean {
	return Object.values(figure.attrs).some((value) => value !== null && value !== undefined);
}

/** Replaces the whole figure with `content`; a caption-only figure leaves an empty paragraph behind. */
function replaceFigureWithContent(
	tr: Transaction,
	state: EditorState,
	figure: FoundNode,
	content: ProseMirrorNode[],
): void {
	const replacement = content.length
		? Fragment.fromArray(content)
		: Fragment.from(state.schema.nodes.paragraph!.create());

	tr.replaceWith(figure.pos, figure.pos + figure.node.nodeSize, replacement);
}

/**
 * Deleting the image out of `<figure><img><figcaption>…</figcaption></figure>` would leave the
 * caption behind as a floating label. Cleanup is scoped to that transition — a figure *losing* its
 * non-caption content — because a caption-only figure is legitimate stored content
 * (`<figure class="media-left"><figcaption>…</figcaption></figure>`) and must survive being loaded.
 */
function orphanCaptionCleanup(): Plugin {
	return new Plugin({
		appendTransaction: (transactions, oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) return null;

			// setContent (value sync, revert, version switch) and select-all-delete replace the whole doc:
			// positions there say nothing about what the user removed
			if (replacesWholeDoc(transactions)) return null;

			const toOldPos = combinedMapping(transactions).invert();
			const orphans: FoundNode[] = [];

			newState.doc.descendants((node, pos) => {
				if (node.type.name !== FIGURE_NODE) return true;
				if (node.childCount === 0 || captionlessContent(node).length > 0) return false;

				const before = oldState.doc.nodeAt(toOldPos.map(pos));

				if (before?.type.name === FIGURE_NODE && captionlessContent(before).length > 0) {
					orphans.push({ pos, node });
				}

				return false;
			});

			if (!orphans.length) return null;

			const tr = newState.tr;

			// back to front so each deletion leaves the earlier positions valid
			for (const orphan of orphans.reverse()) tr.delete(orphan.pos, orphan.pos + orphan.node.nodeSize);

			return tr;
		},
	});
}

function combinedMapping(transactions: readonly Transaction[]): Mapping {
	const mapping = new Mapping();
	for (const transaction of transactions) mapping.appendMapping(transaction.mapping);
	return mapping;
}

function replacesWholeDoc(transactions: readonly Transaction[]): boolean {
	// `transaction.docs[index]` is the doc that step ran against, so a replacement appended by another
	// plugin is measured against its own doc rather than the one the batch started from
	return transactions.some((transaction) =>
		transaction.steps.some(
			(step, index) =>
				step instanceof ReplaceStep && step.from === 0 && step.to === transaction.docs[index]!.content.size,
		),
	);
}
