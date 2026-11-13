import { combineTransactionSteps, getMarkRange } from '@tiptap/core';
import type { MarkType, NodeType, Mark as PMMark, Node as PMNode } from '@tiptap/pm/model';
import { type EditorState, Plugin, type Transaction } from '@tiptap/pm/state';
import { RemoveMarkStep } from '@tiptap/pm/transform';
import { Mark, Node } from '@tiptap/vue-3';
import { passthroughAttribute } from './preserved-attributes';

const NAMED_ANCHOR_SELECTOR = 'a[name]:not([name=""]):not([href])';

/** An `<a name>` jump target with no content, kept as an inline atom. */
export const NamedAnchor = Node.create({
	name: 'namedAnchor',
	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,

	addAttributes() {
		return { name: passthroughAttribute('name') };
	},

	parseHTML() {
		return [{ tag: NAMED_ANCHOR_SELECTOR, getAttrs: (element) => (element.hasChildNodes() ? false : null) }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['a', HTMLAttributes];
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('span');
			dom.className = 'named-anchor';
			dom.contentEditable = 'false';
			dom.title = node.attrs['name'] ?? '';
			return { dom };
		};
	},
});

/** An `<a name>` jump target that wraps text, kept as a mark so the text stays editable. */
export const NamedAnchorText = Mark.create({
	name: 'namedAnchorText',
	// same as Link, so the anchor wraps other marks the way stored HTML does
	priority: 1000,
	inclusive: false,

	addAttributes() {
		return { name: passthroughAttribute('name') };
	},

	parseHTML() {
		return [{ tag: NAMED_ANCHOR_SELECTOR, getAttrs: (element) => (element.hasChildNodes() ? null : false) }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['a', HTMLAttributes, 0];
	},

	addProseMirrorPlugins() {
		return [new Plugin({ appendTransaction: keepAnchorsAsAtoms })];
	},
});

export const namedAnchorExtensions = [NamedAnchor, NamedAnchorText];

interface AtomInsert {
	pos: number;
	mark: PMMark;
	removeTo?: number;
}

function anchorStart(doc: PMNode, markType: MarkType, mark: PMMark): number | null {
	let start: number | null = null;

	doc.descendants((node, pos) => {
		if (start !== null) return false;
		if (node.isText && mark.isInSet(node.marks))
			start = getMarkRange(doc.resolve(pos), markType, mark.attrs)?.from ?? null;
		return true;
	});

	return start;
}

function anchorNames(doc: PMNode, markType: MarkType, atomType: NodeType): Set<string> {
	const names = new Set<string>();

	doc.descendants((node) => {
		if (node.type === atomType) names.add(node.attrs['name']);
		const mark = markType.isInSet(node.marks);
		if (mark) names.add(mark.attrs['name']);
	});

	return names;
}

// a nested `<a>` loses the link on the next load, so a linked or cleared anchor moves before its text
function keepAnchorsAsAtoms(
	transactions: readonly Transaction[],
	oldState: EditorState,
	newState: EditorState,
): Transaction | null {
	if (!transactions.some((tr) => tr.docChanged)) return null;

	const { doc, schema } = newState;
	const markType = schema.marks[NamedAnchorText.name]!;
	const atomType = schema.nodes[NamedAnchor.name]!;
	const linkType = schema.marks['link'];
	const inserts: AtomInsert[] = [];

	doc.descendants((node, pos) => {
		const mark = markType.isInSet(node.marks);
		if (!mark || !linkType?.isInSet(node.marks)) return;

		const range = getMarkRange(doc.resolve(pos), markType, mark.attrs);

		if (range && !inserts.some((insert) => insert.pos === range.from)) {
			inserts.push({ pos: range.from, mark, removeTo: range.to });
		}
	});

	const removedMarks = transactions
		.flatMap((tr) => tr.steps)
		.filter((step): step is RemoveMarkStep => step instanceof RemoveMarkStep && step.mark.type === markType)
		.map((step) => step.mark);

	if (removedMarks.length > 0) {
		const kept = anchorNames(doc, markType, atomType);
		const mapping = combineTransactionSteps(oldState.doc, [...transactions]).mapping;

		for (const mark of removedMarks) {
			if (kept.has(mark.attrs['name'])) continue;
			kept.add(mark.attrs['name']);

			const start = anchorStart(oldState.doc, markType, mark);
			if (start !== null) inserts.push({ pos: mapping.map(start), mark });
		}
	}

	if (inserts.length === 0) return null;

	const tr = newState.tr;

	for (const { pos, mark, removeTo } of inserts.sort((a, b) => b.pos - a.pos)) {
		if (removeTo !== undefined) tr.removeMark(pos, removeTo, mark);
		tr.insert(pos, atomType.create(mark.attrs));
	}

	return tr;
}
