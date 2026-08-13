import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/vue-3';
import { type BlockCustomFormat, type BlockTarget, CONVERTIBLE_TYPES } from './custom-formats';

/**
 * Commands for block-level custom formats. Unlike inline formats (dynamic marks) these need no
 * extension: they write `class` and the other attributes `preserved-attributes.ts` already
 * round-trips on every node type. Toggling off strips only what the format configured, so unrelated
 * classes, ids and `data-`/`aria-` attributes survive.
 */

function classesOf(node: ProseMirrorNode): string[] {
	const value = node.attrs['class'];
	return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}

/** Reads a preserved attribute, resolving `data-`/`aria-` names out of their record attribute. */
function attributeOf(node: ProseMirrorNode, name: string): string | null {
	if (name.startsWith('data-') || name.startsWith('aria-')) {
		const record = node.attrs[name.startsWith('data-') ? 'dataAttributes' : 'ariaAttributes'];
		return (record as Record<string, string> | null)?.[name] ?? null;
	}

	const value = node.attrs[name];
	return typeof value === 'string' ? value : null;
}

function setAttribute(attrs: Record<string, unknown>, name: string, value: string | null): void {
	if (!name.startsWith('data-') && !name.startsWith('aria-')) {
		attrs[name] = value;
		return;
	}

	const key = name.startsWith('data-') ? 'dataAttributes' : 'ariaAttributes';
	const record = { ...((attrs[key] as Record<string, string> | null) ?? {}) };
	if (value === null) delete record[name];
	else record[name] = value;
	attrs[key] = Object.keys(record).length > 0 ? record : null;
}

/** True when the node is the given target, level included for headings. */
function isTarget(node: ProseMirrorNode, target: BlockTarget): boolean {
	if (node.type.name !== target.type) return false;
	return Object.entries(target.attrs ?? {}).every(([name, value]) => node.attrs[name] === value);
}

/**
 * `nodesBetween` also reports blocks a selection merely spans, and after a conversion that includes
 * the empty paragraph TrailingNode appends: re-typing that one appends another, so the doc grows on
 * every click and the format can never read as active (Select All is where this shows). An empty text
 * block is a target only when the selection actually reaches into it. Leaf blocks (`img`, `hr`) hold
 * no content by nature, so they stay eligible.
 */
function isReached(state: EditorState, node: ProseMirrorNode, pos: number): boolean {
	if (!node.isTextblock || node.content.size > 0) return true;

	const { from, to } = state.selection;
	const inside = pos + 1;
	return from === inside || to === inside;
}

/**
 * Blocks a format can act on: its own targets (attributes only, no re-typing), plus convertible
 * blocks a `block` entry re-types — but only where the parent's content expression accepts the
 * target type. `listItem` is `paragraph block*`, so re-typing its first paragraph to a heading
 * would make `setNodeMarkup` throw; skipping it here keeps the active state and the apply in sync.
 */
function isEligible(state: EditorState, node: ProseMirrorNode, pos: number, format: BlockCustomFormat): boolean {
	if (!node.isBlock) return false;
	if (!isReached(state, node, pos)) return false;
	if (format.targets.some((target) => isTarget(node, target))) return true;
	if (!format.convert || !CONVERTIBLE_TYPES.has(node.type.name)) return false;

	const targetType = state.schema.nodes[format.targets[0]!.type];
	if (!targetType) return false;

	const $pos = state.doc.resolve(pos);
	return $pos.parent.canReplaceWith($pos.index(), $pos.index() + 1, targetType);
}

/**
 * A node carries a format when it holds all of its classes, or — for a format anchored on
 * attributes alone — all of its attributes. Mirrors the inline `matches` check so an
 * attributes-only format doesn't read as applied to every plain block.
 */
function carriesFormat(node: ProseMirrorNode, format: BlockCustomFormat): boolean {
	if (!format.targets.some((target) => isTarget(node, target))) return false;

	if (format.classes.length > 0) {
		const classes = classesOf(node);
		return format.classes.every((cls) => classes.includes(cls));
	}

	const attributes = Object.entries(format.attributes);
	if (attributes.length === 0) return false;
	return attributes.every(([name, value]) => attributeOf(node, name) === value);
}

interface EligibleBlock {
	pos: number;
	node: ProseMirrorNode;
}

function eligibleBlocks(state: EditorState, format: BlockCustomFormat): EligibleBlock[] {
	const { from, to } = state.selection;
	const blocks: EligibleBlock[] = [];

	state.doc.nodesBetween(from, to, (node, pos) => {
		if (isEligible(state, node, pos, format)) blocks.push({ pos, node });
	});

	return blocks;
}

/** True when the selection has at least one eligible block and every one carries the format. */
export function isBlockFormatActive(editor: Editor, format: BlockCustomFormat): boolean {
	const blocks = eligibleBlocks(editor.state, format);
	if (blocks.length === 0) return false;
	return blocks.every(({ node }) => carriesFormat(node, format));
}

/** One transaction (so one undo step) re-marking every eligible block in the selection. */
function updateBlocks(
	editor: Editor,
	format: BlockCustomFormat,
	nextAttrs: (node: ProseMirrorNode) => Record<string, unknown>,
	nextType: (node: ProseMirrorNode) => string,
): void {
	// bail before the chain: `focus()` dispatches on its own, which would append a trailing
	// paragraph (TrailingNode) and burn an undo step for a format that has nothing to act on
	if (eligibleBlocks(editor.state, format).length === 0) return;

	editor
		.chain()
		.focus()
		.command(({ tr, state, dispatch }) => {
			const blocks = eligibleBlocks(state, format);
			if (blocks.length === 0) return false;
			if (!dispatch) return true;

			// setNodeMarkup never changes a node's size, so earlier edits can't shift later positions
			for (const { pos, node } of blocks) {
				tr.setNodeMarkup(pos, state.schema.nodes[nextType(node)], nextAttrs(node));
			}

			return true;
		})
		.run();
}

export function applyBlockFormat(editor: Editor, format: BlockCustomFormat): void {
	// a `block` entry re-types the block; a `selector` entry keeps whichever target it matched
	const target = format.convert ? format.targets[0]! : null;

	updateBlocks(
		editor,
		format,
		(node) => {
			const attrs: Record<string, unknown> = { ...node.attrs, ...(target?.attrs ?? {}) };

			if (format.classes.length > 0) {
				attrs['class'] = [...new Set([...classesOf(node), ...format.classes])].join(' ');
			}

			for (const [name, value] of Object.entries(format.attributes)) setAttribute(attrs, name, value);
			return attrs;
		},
		(node) => target?.type ?? node.type.name,
	);
}

/** Removes the format's classes and attributes; the block keeps its tag and everything else. */
export function clearBlockFormat(editor: Editor, format: BlockCustomFormat): void {
	updateBlocks(
		editor,
		format,
		(node) => {
			const attrs: Record<string, unknown> = { ...node.attrs };

			if (format.classes.length > 0) {
				const remaining = classesOf(node).filter((cls) => !format.classes.includes(cls));
				attrs['class'] = remaining.length > 0 ? remaining.join(' ') : null;
			}

			for (const name of Object.keys(format.attributes)) setAttribute(attrs, name, null);
			return attrs;
		},
		(node) => node.type.name,
	);
}

export function toggleBlockFormat(editor: Editor, format: BlockCustomFormat): void {
	if (isBlockFormatActive(editor, format)) clearBlockFormat(editor, format);
	else applyBlockFormat(editor, format);
}
