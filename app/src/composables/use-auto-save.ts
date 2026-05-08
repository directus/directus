import { useDebounceFn } from "@vueuse/core";
import { ref, Ref, watch } from "vue";


/** Minutes of inactivity after which the next save creates a new revision instead of updating in-place. */
export const AUTO_SAVE_SNAPSHOT_INTERVAL_MINUTES = 5;
export const AUTO_SAVE_DEBOUNCE_MS = 750;

export interface UseAutoSaveOptions {
  /** Auto-save only fires when this is true (e.g. currentVersion !== null && hasPermission). */
  enabled: Ref<boolean>;
  /** date_updated of the currently-active version record, used to check revision freshness. */
  currentVersionDateUpdated: Ref<string | null>;
  /** Debounce delay in milliseconds. Default: 750. */
  debounceMs?: number;
}

export function useAutoSave(
	edits: Ref<Record<string, any>>,
	saveRevisionCb: (forceNew: boolean) => Promise<void>,
	options: UseAutoSaveOptions,
) {

	const { enabled, currentVersionDateUpdated, debounceMs = AUTO_SAVE_DEBOUNCE_MS } = options;

	const isSaving = ref(false);
	const sessionHasSaved = ref(false);
	const autoSaveError = ref<Error | null>(null);

	const debouncedSave = useDebounceFn(async () => {
		if (!enabled.value) return;
		if (Object.keys(edits.value).length === 0) return;
		if (isSaving.value) return; // mutex — skip overlapping saves

		const forceNew = !sessionHasSaved.value || isRevisionStale();

		isSaving.value = true;
		autoSaveError.value = null;

		try {
			await saveRevisionCb(forceNew);
			sessionHasSaved.value = true;
		} catch (error) {
			autoSaveError.value = error instanceof Error ? error : new Error(String(error));
		} finally {
			isSaving.value = false;
		}
	}, debounceMs)

	watch(edits, (newEdits) => {
		if (!enabled.value) return;
		if (Object.keys(newEdits).length === 0) return;
		debouncedSave();
	}, { deep: true });


	function isRevisionStale(): boolean {
		const dateUpdated = currentVersionDateUpdated.value;
		if (!dateUpdated) return true;
		const intervalMs = AUTO_SAVE_SNAPSHOT_INTERVAL_MINUTES * 60 * 1000;
		return Date.now() - new Date(dateUpdated).getTime() > intervalMs;
	  }

	  function resetSession() {
		sessionHasSaved.value = false;
	  }

	  return {
		autoSaveError,
		isSaving,
		resetSession,
	  };
}
