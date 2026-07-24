import type { AnyExtension } from '@tiptap/vue-3';
import type { Change } from 'diff';
import { Ref, ref } from 'vue';
import { computeValueNormalizationDiff } from './normalization-diff';

type UsableNormalizationWarning = {
	normalizationLocked: Ref<boolean>;
	normalizationWarningOpen: Ref<boolean>;
	normalizationWarningDiff: Ref<Change[]>;
	checkValue: () => void;
	onLockedClick: () => void;
	confirmNormalizationWarning: () => void;
	cancelNormalizationWarning: () => void;
};

/**
 * Guards stored HTML that contains markup the schema can't represent, i.e. content an edit + save
 * would rewrite (see round-trip.test.ts): the editor stays read-only (`normalizationLocked`) so no
 * edit can reach the value — and thus autosave — until the warning dialog is confirmed. Content
 * that survives normalization never locks.
 */
export function useNormalizationWarning(
	value: Ref<string | null>,
	extraExtensions: AnyExtension[] = [],
): UsableNormalizationWarning {
	const normalizationLocked = ref(false);
	const normalizationWarningOpen = ref(false);
	const normalizationWarningDiff = ref<Change[]>([]);

	return {
		normalizationLocked,
		normalizationWarningOpen,
		normalizationWarningDiff,
		checkValue,
		onLockedClick,
		confirmNormalizationWarning,
		cancelNormalizationWarning,
	};

	// runs on load and on external value changes (async load, revert, version switch) — never on
	// the editor's own emits, so the round-trip stays off the typing path
	function checkValue() {
		if (!value.value) {
			normalizationLocked.value = false;
			normalizationWarningDiff.value = [];
			return;
		}

		const diff = computeValueNormalizationDiff(value.value, extraExtensions);
		normalizationLocked.value = diff !== null;
		normalizationWarningDiff.value = diff ?? [];
	}

	function onLockedClick() {
		if (!normalizationLocked.value) return;
		normalizationWarningOpen.value = true;
	}

	function confirmNormalizationWarning() {
		normalizationWarningOpen.value = false;
		normalizationLocked.value = false;
	}

	function cancelNormalizationWarning() {
		normalizationWarningOpen.value = false;
	}
}
