import type { Editor } from '@tiptap/vue-3';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { formatHtml } from './format-html';
import { computeNormalizationDiff } from './normalization-diff';

type UsableSourceCode = {
	sourceCodeDrawerOpen: Ref<boolean>;
	code: Ref<string>;
	normalizeConfirmOpen: Ref<boolean>;
	normalizeDiff: Ref<Change[]>;
	openSourceCodeDrawer: () => void;
	closeSourceCodeDrawer: () => void;
	saveSourceCode: () => void;
	confirmSaveSourceCode: () => void;
	cancelNormalize: () => void;
};

export function useSourceCode(editor: Ref<Editor>): UsableSourceCode {
	const sourceCodeDrawerOpen = ref(false);
	const code = ref('');
	const normalizeConfirmOpen = ref(false);
	const normalizeDiff = ref<Change[]>([]);

	return {
		sourceCodeDrawerOpen,
		code,
		normalizeConfirmOpen,
		normalizeDiff,
		openSourceCodeDrawer,
		closeSourceCodeDrawer,
		saveSourceCode,
		confirmSaveSourceCode,
		cancelNormalize,
	};

	// Pretty-print only; an unchanged save re-parses to the same document (see format-html.ts).
	function openSourceCodeDrawer() {
		code.value = formatHtml(editor.value.getHTML());
		sourceCodeDrawerOpen.value = true;
	}

	function closeSourceCodeDrawer() {
		sourceCodeDrawerOpen.value = false;
	}

	// If saving would drop markup the schema can't represent, surface the diff for confirmation;
	// otherwise apply straight away.
	function saveSourceCode() {
		const diff = computeNormalizationDiff(code.value);

		if (diff === null) {
			applySourceCode();
			return;
		}

		normalizeDiff.value = diff;
		normalizeConfirmOpen.value = true;
	}

	function confirmSaveSourceCode() {
		normalizeConfirmOpen.value = false;
		applySourceCode();
	}

	// Close the confirmation but keep the drawer open so the user can keep editing.
	function cancelNormalize() {
		normalizeConfirmOpen.value = false;
	}

	// setContent normalizes markup the schema can't represent; emitUpdate fires onUpdate so the
	// field value syncs (see input-rich-text-html.vue).
	function applySourceCode() {
		editor.value.chain().focus().setContent(code.value, { emitUpdate: true }).run();
		closeSourceCodeDrawer();
	}
}
