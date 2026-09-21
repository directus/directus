import { getHTMLFromFragment } from '@tiptap/core';
import { DOMParser as ProseMirrorDOMParser, type Schema } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { AnyExtension, Editor } from '@tiptap/vue-3';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { encodePageBreaks } from '../extensions/page-break';
import { findMarkupLoss } from './markup-loss';
import { diffFormatted, roundTrip } from './normalization-diff';

type PendingPaste = { html: string; from: number; to: number; event: ClipboardEvent };

type UsablePasteWarning = {
	pasteWarningOpen: Ref<boolean>;
	pasteWarningDiff: Ref<Change[]>;
	handlePaste: (view: EditorView, event: ClipboardEvent) => boolean;
	confirmPaste: () => void;
	takeRawPaste: () => string | null;
	cancelPaste: () => void;
};

/**
 * Guards the paste that lands markup the schema can't represent (Figma and Word wrap their output
 * in spans the editor drops): holds the clipboard HTML back, shows what a paste would lose, and
 * lets the user choose the cleaned version or the raw HTML. Without it the loss only surfaces on
 * the next load, as the read-only lock in use-normalization-warning.ts.
 */
export function usePasteWarning(
	editor: Ref<Editor | undefined>,
	extraExtensions: AnyExtension[] = [],
): UsablePasteWarning {
	const pasteWarningOpen = ref(false);
	const pasteWarningDiff = ref<Change[]>([]);
	let pending: PendingPaste | null = null;
	let replaying = false;

	return {
		pasteWarningOpen,
		pasteWarningDiff,
		handlePaste,
		confirmPaste,
		takeRawPaste,
		cancelPaste,
	};

	// `true` stops ProseMirror from inserting anything, so the document only changes once the dialog
	// is answered. Plain text carries no markup to lose and never reaches the check. The gate is
	// what the schema drops, not whether it rewrites: `<b>` to `<strong>` or an implied `<tbody>`
	// is not a loss. The textual diff is only the picture shown in the dialog.
	function handlePaste(view: EditorView, event: ClipboardEvent) {
		if (replaying) return false;

		const clipboard = event.clipboardData?.getData('text/html');
		if (!clipboard) return false;

		const html = clipboardContent(clipboard, view.state.schema);
		const normalized = roundTrip(html, extraExtensions);
		if (findMarkupLoss(html, normalized, view.state.schema).length === 0) return false;

		const diff = diffFormatted(html, normalized);
		if (diff === null) return false;

		const { from, to } = view.state.selection;
		pending = { html, from, to, event };
		pasteWarningDiff.value = diff;
		pasteWarningOpen.value = true;
		return true;
	}

	// normalized first so the stored value matches its own reload (a `pre-wrap` span keeps whitespace
	// that collapses once the span is gone); pasteHTML keeps the ordinary paste semantics
	function confirmPaste() {
		const paste = take();
		if (!paste || !editor.value) return;

		editor.value.chain().focus().setTextSelection({ from: paste.from, to: paste.to }).run();
		replaying = true;

		try {
			editor.value.view.pasteHTML(roundTrip(paste.html, extraExtensions), paste.event);
		} finally {
			replaying = false;
		}
	}

	/**
	 * The stored HTML with the clipboard spliced in verbatim where the cursor was, for raw editing.
	 * A cursor inside a block splits that block in two — the trade for keeping the paste untouched.
	 */
	function takeRawPaste() {
		const paste = take();
		if (!paste || !editor.value) return null;
		if (editor.value.isEmpty) return paste.html;

		const { doc, schema } = editor.value.state;
		const before = getHTMLFromFragment(doc.cut(0, paste.from).content, schema);
		const after = getHTMLFromFragment(doc.cut(paste.to, doc.content.size).content, schema);

		return encodePageBreaks(before + paste.html + after);
	}

	function cancelPaste() {
		take();
	}

	function take() {
		const paste = pending;
		pending = null;
		pasteWarningOpen.value = false;
		return paste;
	}
}

/**
 * The clipboard reduced to what the editor would keep: browsers frame it in a `<meta charset>` and
 * fragment comments, ProseMirror stamps the first element with `data-pm-slice`, and an inline copy
 * has no block wrapper. The editor drops or adds all of these on any paste, so left in they read as
 * loss and trip the warning on valid content.
 */
function clipboardContent(html: string, schema: Schema): string {
	const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

	for (const meta of Array.from(body.querySelectorAll('meta'))) meta.remove();
	for (const el of Array.from(body.querySelectorAll('[data-pm-slice]'))) el.removeAttribute('data-pm-slice');

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
