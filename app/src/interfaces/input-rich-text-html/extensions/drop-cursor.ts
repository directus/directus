import { Extension } from '@tiptap/core';
import { type EditorState, Plugin } from '@tiptap/pm/state';
import { dropPoint } from '@tiptap/pm/transform';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Drop-in replacement for StarterKit's Dropcursor, forked from prosemirror-dropcursor@1.8.2 (MIT).
 *
 * Upstream picks the indicator orientation from the document structure alone: any gap between
 * block nodes gets a horizontal line. Our media/image nodes are block nodes rendered
 * `inline-block`, so small ones share a visual row and the horizontal line reads wrong
 * (see verticalDropRect). Only that block-gap branch of updateOverlay differs from upstream.
 */

export interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export interface RowNeighbor {
	rect: Rect;
	/** participates in row flow, i.e. computed display is inline-block/inline */
	inline: boolean;
	rtl: boolean;
}

interface Point {
	x: number;
	y: number;
}

/** Vertical indicator centered in the horizontal gap between two nodes sharing a visual row. */
function rowGapRect(before: Rect, after: Rect, halfWidth: number): Rect | null {
	const sameRow = before.top < after.bottom && after.top < before.bottom;
	if (!sameRow) return null;

	let x: number;

	if (before.right <= after.left) {
		x = (before.right + after.left) / 2;
	} else if (after.right <= before.left) {
		// rtl row
		x = (after.right + before.left) / 2;
	} else {
		return null;
	}

	return {
		left: x - halfWidth,
		right: x + halfWidth,
		top: Math.min(before.top, after.top),
		bottom: Math.max(before.bottom, after.bottom),
	};
}

/**
 * Vertical indicator rect for a block gap, or null when the gap should keep upstream's horizontal
 * line. Two cases render vertically: the gap between two nodes sharing a visual row, and a
 * row-edge gap (first/last position in a row of inline-block nodes). A row-edge gap is the same
 * document position as the boundary to the stacked neighbor above/below, so the drag pointer
 * decides: only when it is vertically within the row-flow neighbor does the row edge win.
 */
export function verticalDropRect(
	before: RowNeighbor | null,
	after: RowNeighbor | null,
	pointer: Point | null,
	halfWidth: number,
): Rect | null {
	if (before && after) {
		const between = rowGapRect(before.rect, after.rect, halfWidth);
		if (between) return between;
	}

	const edges = [
		{ neighbor: after, start: true },
		{ neighbor: before, start: false },
	];

	for (const { neighbor, start } of edges) {
		if (!neighbor?.inline || !pointer) continue;
		if (pointer.y < neighbor.rect.top || pointer.y > neighbor.rect.bottom) continue;

		const x = start !== neighbor.rtl ? neighbor.rect.left : neighbor.rect.right;

		return {
			left: x - halfWidth,
			right: x + halfWidth,
			top: neighbor.rect.top,
			bottom: neighbor.rect.bottom,
		};
	}

	return null;
}

function rowNeighbor(dom: globalThis.Node | null): RowNeighbor | null {
	if (!(dom instanceof HTMLElement)) return null;

	const style = getComputedStyle(dom);

	return {
		rect: dom.getBoundingClientRect(),
		inline: style.display.startsWith('inline'),
		rtl: style.direction === 'rtl',
	};
}

interface DropCursorOptions {
	color?: string | false;
	width?: number;
	class?: string;
}

class DropCursorView {
	editorView: EditorView;
	cursorPos: number | null = null;
	element: HTMLElement | null = null;
	lastPoint: Point | null = null;
	timeout = -1;
	width: number;
	color: string | undefined;
	class: string | undefined;
	handlers: { name: string; handler: (event: Event) => void }[];

	constructor(editorView: EditorView, options: DropCursorOptions) {
		this.editorView = editorView;
		this.width = options.width ?? 1;
		this.color = options.color === false ? undefined : options.color || 'black';
		this.class = options.class;

		this.handlers = (['dragover', 'dragend', 'drop', 'dragleave'] as const).map((name) => {
			const handler = (e: Event) => this[name](e as DragEvent);
			editorView.dom.addEventListener(name, handler);
			return { name, handler };
		});
	}

	destroy() {
		this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
	}

	update(editorView: EditorView, prevState: EditorState) {
		if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
			if (this.cursorPos > editorView.state.doc.content.size) this.setCursor(null);
			else this.updateOverlay();
		}
	}

	setCursor(pos: number | null) {
		if (pos == this.cursorPos) return;
		this.cursorPos = pos;

		if (pos == null) {
			this.element?.remove();
			this.element = null;
		} else {
			this.updateOverlay();
		}
	}

	updateOverlay() {
		if (this.cursorPos == null) return;

		const $pos = this.editorView.state.doc.resolve(this.cursorPos);
		const isBlock = !$pos.parent.inlineContent;
		let rect: Rect | undefined;
		const editorDOM = this.editorView.dom;
		const editorRect = editorDOM.getBoundingClientRect();
		const scaleX = editorRect.width / editorDOM.offsetWidth;
		const scaleY = editorRect.height / editorDOM.offsetHeight;

		if (isBlock) {
			const before = $pos.nodeBefore;
			const after = $pos.nodeAfter;

			if (before || after) {
				const beforeN = before ? rowNeighbor(this.editorView.nodeDOM(this.cursorPos - before.nodeSize)) : null;
				const afterN = after ? rowNeighbor(this.editorView.nodeDOM(this.cursorPos)) : null;

				rect = verticalDropRect(beforeN, afterN, this.lastPoint, (this.width / 2) * scaleX) ?? undefined;

				const anchor = beforeN ?? afterN;

				if (!rect && anchor) {
					let top = beforeN ? anchor.rect.bottom : anchor.rect.top;
					if (beforeN && afterN) top = (top + afterN.rect.top) / 2;
					const halfWidth = (this.width / 2) * scaleY;
					rect = { left: anchor.rect.left, right: anchor.rect.right, top: top - halfWidth, bottom: top + halfWidth };
				}
			}
		}

		if (!rect) {
			const coords = this.editorView.coordsAtPos(this.cursorPos);
			const halfWidth = (this.width / 2) * scaleX;
			rect = { left: coords.left - halfWidth, right: coords.left + halfWidth, top: coords.top, bottom: coords.bottom };
		}

		const parent = this.editorView.dom.offsetParent as HTMLElement | null;

		if (!this.element) {
			this.element = (parent ?? document.body).appendChild(document.createElement('div'));
			if (this.class) this.element.className = this.class;
			this.element.style.cssText = 'position: absolute; z-index: 50; pointer-events: none;';
			if (this.color) this.element.style.backgroundColor = this.color;
		}

		this.element.classList.toggle('prosemirror-dropcursor-block', isBlock);
		this.element.classList.toggle('prosemirror-dropcursor-inline', !isBlock);

		let parentLeft: number;
		let parentTop: number;

		if (!parent || (parent == document.body && getComputedStyle(parent).position == 'static')) {
			parentLeft = -pageXOffset;
			parentTop = -pageYOffset;
		} else {
			const parentRect = parent.getBoundingClientRect();
			const parentScaleX = parentRect.width / parent.offsetWidth;
			const parentScaleY = parentRect.height / parent.offsetHeight;
			parentLeft = parentRect.left - parent.scrollLeft * parentScaleX;
			parentTop = parentRect.top - parent.scrollTop * parentScaleY;
		}

		this.element.style.left = (rect.left - parentLeft) / scaleX + 'px';
		this.element.style.top = (rect.top - parentTop) / scaleY + 'px';
		this.element.style.width = (rect.right - rect.left) / scaleX + 'px';
		this.element.style.height = (rect.bottom - rect.top) / scaleY + 'px';
	}

	scheduleRemoval(timeout: number) {
		clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.setCursor(null), timeout);
	}

	dragover(event: DragEvent) {
		if (!this.editorView.editable) return;

		const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
		const node = pos && pos.inside >= 0 ? this.editorView.state.doc.nodeAt(pos.inside) : null;
		const disableDropCursor = node && node.type.spec['disableDropCursor'];

		const disabled =
			typeof disableDropCursor == 'function' ? disableDropCursor(this.editorView, pos, event) : disableDropCursor;

		if (pos && !disabled) {
			let target: number | null = pos.pos;

			if (this.editorView.dragging && this.editorView.dragging.slice) {
				const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
				if (point != null) target = point;
			}

			this.lastPoint = { x: event.clientX, y: event.clientY };

			// same position can flip orientation as the pointer moves (row edge vs stacked boundary),
			// so re-render even when setCursor would short-circuit
			if (target == this.cursorPos) this.updateOverlay();
			else this.setCursor(target);

			this.scheduleRemoval(5000);
		}
	}

	dragend() {
		this.scheduleRemoval(20);
	}

	drop() {
		this.scheduleRemoval(20);
	}

	dragleave(event: DragEvent) {
		if (!this.editorView.dom.contains(event.relatedTarget as globalThis.Node | null)) this.setCursor(null);
	}
}

export const DropCursor = Extension.create<DropCursorOptions>({
	name: 'dropCursor',

	addOptions() {
		return {
			color: 'currentColor',
			width: 1,
			class: undefined,
		};
	},

	addProseMirrorPlugins() {
		const options = this.options;

		return [
			new Plugin({
				view: (editorView) => new DropCursorView(editorView, options),
			}),
		];
	},
});
