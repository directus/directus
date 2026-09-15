import { getHTMLFromFragment } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import type { AnyExtension, Editor } from '@tiptap/vue-3';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { encodePageBreaks } from '../extensions/page-break';
import { computeNormalizationDiff } from './normalization-diff';

type PendingPaste = { html: string; from: number; to: number };

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

	return {
		pasteWarningOpen,
		pasteWarningDiff,
		handlePaste,
		confirmPaste,
		takeRawPaste,
		cancelPaste,
	};

	// `true` stops ProseMirror from inserting anything, so the document only changes once the dialog
	// is answered. Plain text carries no markup to lose and never reaches the check.
	function handlePaste(view: EditorView, event: ClipboardEvent) {
		const html = event.clipboardData?.getData('text/html');
		if (!html) return false;

		const diff = computeNormalizationDiff(html, extraExtensions);
		if (diff === null) return false;

		const { from, to } = view.state.selection;
		pending = { html, from, to };
		pasteWarningDiff.value = diff;
		pasteWarningOpen.value = true;
		return true;
	}

	/** Replays the paste the ordinary way: the schema strips what it can't keep. */
	function confirmPaste() {
		const paste = take();
		if (!paste || !editor.value) return;

		editor.value.chain().focus().insertContentAt({ from: paste.from, to: paste.to }, paste.html).run();
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
