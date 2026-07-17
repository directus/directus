import { useLocalStorage } from '@vueuse/core';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { computeValueNormalizationDiff } from './normalization-diff';

export const NORMALIZATION_WARNING_DISMISSED = 'directus-wysiwyg_normalization_warning_dismissed';

type UsableNormalizationWarning = {
	normalizationLocked: Ref<boolean>;
	normalizationWarningOpen: Ref<boolean>;
	normalizationWarningDiff: Ref<Change[]>;
	dontShowAgain: Ref<boolean>;
	checkValue: () => void;
	onLockedClick: () => void;
	confirmNormalizationWarning: () => void;
	cancelNormalizationWarning: () => void;
};

/**
 * Guards stored HTML that contains markup the schema can't represent, i.e. content an edit + save
 * would rewrite (see round-trip.test.ts): the editor stays read-only (`normalizationLocked`) so no
 * edit can reach the value — and thus autosave — until the warning dialog is confirmed. Content
 * that survives normalization never locks. Opt-out persists per browser.
 */
export function useNormalizationWarning(value: Ref<string | null>): UsableNormalizationWarning {
	const dismissed = useLocalStorage(NORMALIZATION_WARNING_DISMISSED, false);

	const normalizationLocked = ref(false);
	const normalizationWarningOpen = ref(false);
	const normalizationWarningDiff = ref<Change[]>([]);
	const dontShowAgain = ref(false);

	return {
		normalizationLocked,
		normalizationWarningOpen,
		normalizationWarningDiff,
		dontShowAgain,
		checkValue,
		onLockedClick,
		confirmNormalizationWarning,
		cancelNormalizationWarning,
	};

	// runs on load and on external value changes (async load, revert, version switch) — never on
	// the editor's own emits, so the round-trip stays off the typing path
	function checkValue() {
		if (dismissed.value || !value.value) {
			normalizationLocked.value = false;
			normalizationWarningDiff.value = [];
			return;
		}

		const diff = computeValueNormalizationDiff(value.value);
		normalizationLocked.value = diff !== null;
		normalizationWarningDiff.value = diff ?? [];
	}

	function onLockedClick() {
		if (!normalizationLocked.value) return;
		normalizationWarningOpen.value = true;
	}

	function confirmNormalizationWarning() {
		persistOptOut();
		normalizationWarningOpen.value = false;
		normalizationLocked.value = false;
	}

	function cancelNormalizationWarning() {
		persistOptOut();
		normalizationWarningOpen.value = false;
		// opting out on cancel must still unlock — otherwise the field is uneditable with no dialog left
		if (dismissed.value) normalizationLocked.value = false;
	}

	// the opt-out is honored on both actions — either way the user explicitly declined future warnings
	function persistOptOut() {
		if (dontShowAgain.value) dismissed.value = true;
	}
}
