import type { Editor } from '@tiptap/vue-3';
import { useLocalStorage } from '@vueuse/core';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { computeValueNormalizationDiff } from './normalization-diff';

export const NORMALIZATION_WARNING_DISMISSED = 'directus-wysiwyg_normalization_warning_dismissed';

type UsableNormalizationWarning = {
	normalizationWarningOpen: Ref<boolean>;
	normalizationWarningDiff: Ref<Change[]>;
	dontShowAgain: Ref<boolean>;
	onEditorFocus: () => void;
	confirmNormalizationWarning: () => void;
	cancelNormalizationWarning: () => void;
};

/**
 * Warns on first focus when the stored HTML contains markup the schema can't represent, i.e. when
 * an edit + save would rewrite it (see round-trip.test.ts). Content that survives normalization
 * never triggers the dialog. Opt-out persists per browser.
 */
export function useNormalizationWarning(editor: Ref<Editor>, value: Ref<string | null>): UsableNormalizationWarning {
	const dismissed = useLocalStorage(NORMALIZATION_WARNING_DISMISSED, false);

	const normalizationWarningOpen = ref(false);
	const normalizationWarningDiff = ref<Change[]>([]);
	const dontShowAgain = ref(false);

	// at most one check per mount: keeps the round-trip off every focus and swallows the refocus
	// the closing dialog hands back to the editor
	let checked = false;

	return {
		normalizationWarningOpen,
		normalizationWarningDiff,
		dontShowAgain,
		onEditorFocus,
		confirmNormalizationWarning,
		cancelNormalizationWarning,
	};

	function onEditorFocus() {
		// an empty value doesn't consume the check — async-loaded content is still checked on a later focus
		if (checked || dismissed.value || !value.value) return;
		checked = true;

		const diff = computeValueNormalizationDiff(value.value);
		if (diff === null) return;

		normalizationWarningDiff.value = diff;
		normalizationWarningOpen.value = true;
	}

	function confirmNormalizationWarning() {
		persistOptOut();
		normalizationWarningOpen.value = false;
		editor.value.commands.focus();
	}

	function cancelNormalizationWarning() {
		persistOptOut();
		normalizationWarningOpen.value = false;
		editor.value.commands.blur();
	}

	// the opt-out is honored on both actions — either way the user explicitly declined future warnings
	function persistOptOut() {
		if (dontShowAgain.value) dismissed.value = true;
	}
}
