import { DOMSerializer } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/vue-3';
import { useClipboardItems } from '@vueuse/core';

/**
 * cut/copy/paste handlers backed by the async Clipboard API.
 * copy/cut preserve rich HTML; paste is best-effort — `clipboard.read()` is
 * unavailable to web pages in Firefox, where native Ctrl/Cmd+V still works.
 */
export function useClipboardActions() {
	const { copy, isSupported } = useClipboardItems();

	function selectionToItem(editor: Editor): ClipboardItem {
		const { state } = editor;
		const { from, to } = state.selection;
		const slice = state.selection.content();
		const fragment = DOMSerializer.fromSchema(state.schema).serializeFragment(slice.content);
		const div = document.createElement('div');
		div.append(fragment);

		return new ClipboardItem({
			'text/html': new Blob([div.innerHTML], { type: 'text/html' }),
			'text/plain': new Blob([state.doc.textBetween(from, to, '\n')], { type: 'text/plain' }),
		});
	}

	async function copySelection(editor: Editor) {
		if (editor.state.selection.empty || !isSupported.value) return;
		await copy([selectionToItem(editor)]);
	}

	async function cutSelection(editor: Editor) {
		if (editor.state.selection.empty) return;
		await copySelection(editor);
		editor.chain().focus().deleteSelection().run();
	}

	async function paste(editor: Editor) {
		try {
			if ('read' in navigator.clipboard) {
				const items = await navigator.clipboard.read();

				for (const item of items) {
					if (item.types.includes('text/html')) {
						const html = await (await item.getType('text/html')).text();
						editor.chain().focus().insertContent(html).run();
						return;
					}
				}
			}

			const text = await navigator.clipboard.readText();
			if (text) editor.chain().focus().insertContent(text).run();
		} catch {
			// permission denied / unsupported (e.g. Firefox) — native Ctrl+V still works
		}
	}

	return { copySelection, cutSelection, paste };
}
