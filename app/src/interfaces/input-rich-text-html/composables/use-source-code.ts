import type { Editor } from '@tiptap/vue-3';
import { Ref, ref } from 'vue';
import { formatHtml } from './format-html';

type UsableSourceCode = {
	sourceCodeDrawerOpen: Ref<boolean>;
	code: Ref<string>;
	openSourceCodeDrawer: () => void;
	closeSourceCodeDrawer: () => void;
	saveSourceCode: () => void;
};

export function useSourceCode(editor: Ref<Editor>): UsableSourceCode {
	const sourceCodeDrawerOpen = ref(false);
	const code = ref('');

	return { sourceCodeDrawerOpen, code, openSourceCodeDrawer, closeSourceCodeDrawer, saveSourceCode };

	// Pretty-print only; an unchanged save re-parses to the same document (see format-html.ts).
	function openSourceCodeDrawer() {
		code.value = formatHtml(editor.value.getHTML());
		sourceCodeDrawerOpen.value = true;
	}

	function closeSourceCodeDrawer() {
		sourceCodeDrawerOpen.value = false;
	}

	// setContent normalizes markup the schema can't represent; emitUpdate fires onUpdate so the
	// field value syncs (see input-rich-text-html.vue).
	function saveSourceCode() {
		editor.value.chain().focus().setContent(code.value, { emitUpdate: true }).run();
		closeSourceCodeDrawer();
	}
}
