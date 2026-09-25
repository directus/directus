import { getHTMLFromFragment } from '@tiptap/core';
import { closeHistory, undoDepth } from '@tiptap/pm/history';
import { DOMParser as ProseMirrorDOMParser, type Node as ProseMirrorNode, type Schema } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { AnyExtension, Editor } from '@tiptap/vue-3';
import type { Change } from 'diff';
import { Ref, ref, watch } from 'vue';
import { encodePageBreaks } from '../extensions/page-break';
import { findMarkupLoss } from './markup-loss';
import { diffFormatted, roundTrip } from './normalization-diff';

type CleanedPaste = { html: string; from: number; to: number; depth: number };

type UsablePasteWarning = {
	pasteNoticeVisible: Ref<boolean>;
	pasteWarningOpen: Ref<boolean>;
	pasteWarningDiff: Ref<Change[]>;
	pasteUndoable: Ref<boolean>;
	handlePaste: (view: EditorView, event: ClipboardEvent) => boolean;
	openPasteWarning: () => void;
	keepPaste: () => void;
	undoPaste: () => void;
	takeRawPaste: () => string | null;
	dismissPasteWarning: () => void;
};

/**
 * Flags the paste that lands markup the schema can't represent (Figma and Word wrap their output
 * in spans the editor drops): the cleaned version goes in right away, and a notice says so with a
 * way to see what was removed, take the paste back out, or redo it raw. Without it the loss only
 * surfaces on the next load, as the read-only lock in use-normalization-warning.ts.
 */
export function usePasteWarning(
	editor: Ref<Editor | undefined>,
	extraExtensions: AnyExtension[] = [],
): UsablePasteWarning {
	const pasteNoticeVisible = ref(false);
	const pasteWarningOpen = ref(false);
	const pasteWarningDiff = ref<Change[]>([]);
	const pasteUndoable = ref(false);
	let cleaned: CleanedPaste | null = null;
	let replaying = false;

	// a Cmd+Z past the paste takes it out through the editor's own history, so the notice would
	// otherwise offer to undo something else
	watch(
		editor,
		(instance) => {
			instance?.on('update', ({ editor }) => {
				if (cleaned && undoDepth(editor.state) < cleaned.depth) dismissPasteWarning();
			});
		},
		{ immediate: true },
	);

	// the overlay click and Esc close the dialog through v-model, which counts as keeping the paste
	watch(pasteWarningOpen, (open) => {
		if (!open) keepPaste();
	});

	return {
		pasteNoticeVisible,
		pasteWarningOpen,
		pasteWarningDiff,
		pasteUndoable,
		handlePaste,
		openPasteWarning,
		keepPaste,
		undoPaste,
		takeRawPaste,
		dismissPasteWarning,
	};

	// `true` stops ProseMirror from inserting the clipboard as-is; the cleaned copy goes in through
	// pasteHTML instead, so it keeps the ordinary paste semantics and lands as one history event.
	// Plain text carries no markup to lose and never reaches the check. The gate is what the schema
	// drops, not whether it rewrites: `<b>` to `<strong>` or an implied `<tbody>` is not a loss. The
	// textual diff is only the picture shown in the dialog.
	function handlePaste(view: EditorView, event: ClipboardEvent) {
		if (replaying) return false;

		const clipboard = event.clipboardData?.getData('text/html');
		if (!clipboard) return false;

		const html = clipboardContent(clipboard, view.state.schema);
		const normalized = roundTrip(html, extraExtensions);
		if (findMarkupLoss(html, normalized, view.state.schema).length === 0) return false;

		const diff = diffFormatted(html, normalized);
		if (diff === null) return false;

		// normalized first so the stored value matches its own reload (a `pre-wrap` span keeps
		// whitespace that collapses once the span is gone)
		const { from, to } = view.state.selection;
		replaying = true;

		try {
			// typing right before the paste would otherwise share its history event, and undo both
			view.dispatch(closeHistory(view.state.tr));
			view.pasteHTML(normalized, event);
		} finally {
			replaying = false;
		}

		cleaned = { html, from, to, depth: undoDepth(view.state) };
		pasteWarningDiff.value = diff;
		pasteNoticeVisible.value = true;
		return true;
	}

	// undo is only exact while the paste is still the newest history event
	function openPasteWarning() {
		if (!cleaned || !editor.value) return;
		pasteUndoable.value = undoDepth(editor.value.state) === cleaned.depth;
		pasteWarningOpen.value = true;
	}

	function keepPaste() {
		dismissPasteWarning();
	}

	function undoPaste() {
		takeUndone();
		dismissPasteWarning();
	}

	/**
	 * The stored HTML with the clipboard spliced in verbatim where the paste went, for raw editing.
	 * A cursor inside a block splits that block in two — the trade for keeping the paste untouched.
	 * A cursor at a block's edge leaves an empty half behind, which is dropped.
	 */
	function takeRawPaste() {
		const paste = takeUndone();
		if (!paste || !editor.value) return null;
		dismissPasteWarning();
		if (editor.value.isEmpty) return paste.html;

		const { doc, schema } = editor.value.state;
		let before = doc.cut(0, paste.from).content;
		let after = doc.cut(paste.to, doc.content.size).content;

		const emptyBlock = (node: ProseMirrorNode | null | undefined) =>
			!!node && node.isTextblock && node.content.size === 0;

		if (emptyBlock(before.lastChild)) before = before.cut(0, before.size - before.lastChild!.nodeSize);
		if (emptyBlock(after.firstChild)) after = after.cut(after.firstChild!.nodeSize);

		return encodePageBreaks(getHTMLFromFragment(before, schema) + paste.html + getHTMLFromFragment(after, schema));
	}

	function dismissPasteWarning() {
		cleaned = null;
		pasteUndoable.value = false;
		pasteNoticeVisible.value = false;
		pasteWarningOpen.value = false;
	}

	// takes the cleaned paste back out of the document, leaving it as it was before the paste
	function takeUndone() {
		if (!cleaned || !editor.value) return null;
		if (undoDepth(editor.value.state) !== cleaned.depth) return null;

		const paste = cleaned;
		editor.value.chain().focus().undo().run();
		return paste;
	}
}

/**
 * Declarations Google Docs stamps on every paragraph, span, and list regardless of what the author
 * did. `null` strips the property whatever its value; a string strips only that value, so an
 * underline, a sub/superscript, or an indent the author chose is still checked.
 */
const GOOGLE_DOCS_DEFAULTS: Record<string, string | null> = {
	'line-height': null,
	'margin-top': null,
	'margin-bottom': null,
	'padding-inline-start': null,
	'white-space': null,
	'-webkit-text-decoration-skip': null,
	'text-decoration-skip-ink': null,
	'font-variant': 'normal',
	'text-decoration': 'none',
	'vertical-align': 'baseline',
};

/**
 * Google Docs frames its payload in a `<b style="font-weight:normal" id="docs-internal-guid-…">` the
 * editor unwraps, and fills it with its document defaults. None of it is formatting the author
 * chose, so it is not a loss and is stripped before the check.
 */
function unwrapGoogleDocs(wrapper: Element) {
	// list markers, table cells and images carry layout the editor never models (the text inside
	// keeps its own formatting); Docs also frames every table in an aligned <div>
	for (const el of Array.from(
		wrapper.querySelectorAll('li[style], table[style], tr[style], td[style], th[style], img[style]'),
	)) {
		el.removeAttribute('style');
	}

	for (const col of Array.from(wrapper.querySelectorAll('col[width]'))) col.removeAttribute('width');

	for (const table of Array.from(wrapper.querySelectorAll('table'))) {
		const frame = table.parentElement;
		if (frame?.tagName === 'DIV') frame.replaceWith(...Array.from(frame.childNodes));
	}

	// an image sits in a sizing <span> inside a text-styled <span>, neither of which holds text
	for (const span of Array.from(wrapper.querySelectorAll('span'))) {
		if (span.querySelector('img') && span.textContent?.trim() === '') span.replaceWith(...Array.from(span.childNodes));
	}

	for (const el of Array.from(wrapper.querySelectorAll<HTMLElement>('[style]'))) {
		for (const [property, value] of Object.entries(GOOGLE_DOCS_DEFAULTS)) {
			if (value === null || el.style.getPropertyValue(property) === value) el.style.removeProperty(property);
		}

		if (el.style.length === 0) el.removeAttribute('style');
	}

	wrapper.replaceWith(...Array.from(wrapper.childNodes));
}

/**
 * The clipboard reduced to what the editor would keep: browsers frame it in a `<meta charset>` and
 * fragment comments, ProseMirror stamps the first element with `data-pm-slice`, Google Docs wraps
 * everything in a `<b>` full of its defaults, and an inline copy has no block wrapper. The editor
 * drops or adds all of these on any paste, so left in they read as loss and trip the warning on
 * valid content.
 */
function clipboardContent(html: string, schema: Schema): string {
	const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

	for (const meta of Array.from(body.querySelectorAll('meta'))) meta.remove();
	for (const el of Array.from(body.querySelectorAll('[data-pm-slice]'))) el.removeAttribute('data-pm-slice');

	for (const wrapper of Array.from(body.querySelectorAll('b[id^="docs-internal-guid-"]'))) unwrapGoogleDocs(wrapper);

	const walker = body.ownerDocument.createTreeWalker(body, NodeFilter.SHOW_COMMENT);
	const comments: Node[] = [];
	while (walker.nextNode()) comments.push(walker.currentNode);
	for (const comment of comments) comment.parentNode?.removeChild(comment);

	// the same open parse the clipboard path uses, so "inline" means what the editor will decide
	const { content } = ProseMirrorDOMParser.fromSchema(schema).parseSlice(body);
	let inlineOnly = content.childCount > 0;

	content.forEach((node) => {
		if (!node.isInline) inlineOnly = false;
	});

	return inlineOnly ? `<p>${body.innerHTML}</p>` : body.innerHTML;
}
