import { useDebounceFn } from '@vueuse/core';
import { computed, onScopeDispose, ref, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { useServerStore } from '@/stores/server';
import type { ContentVersionMaybeNew } from '@/types/versions';

export const AUTO_SAVE_DEBOUNCE_MS = 650;
export const AUTO_SAVE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000];

export interface UseAutoSaveOptions {
	currentVersion: Ref<ContentVersionMaybeNew | null>;
	updateVersionsAllowed: Ref<boolean>;
	collection: Ref<string>;
	debounceMs?: number;
}

export function useAutoSave(
	edits: Ref<Record<string, any>>,
	saveCallback: (forceNewRevision: boolean) => Promise<void>,
	options: UseAutoSaveOptions,
) {
	const { currentVersion, updateVersionsAllowed, collection, debounceMs = AUTO_SAVE_DEBOUNCE_MS } = options;
	const serverStore = useServerStore();
	const collectionsStore = useCollectionsStore();
	const notificationsStore = useNotificationsStore();
	const { t } = useI18n();

	const enabled = computed(() => currentVersion.value !== null && updateVersionsAllowed.value);

	const currentVersionDateUpdated = computed(() => {
		const v = currentVersion.value;
		return v && 'date_updated' in v ? (v.date_updated ?? null) : null;
	});

	const isSaving = ref(false);
	const hasOpenRevision = ref(false);
	const autoSaveError = ref<Error | null>(null);
	let errorNotificationId: string | null = null;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let retryAttempt = 0;
	let pendingSave = false;
	let currentSave: Promise<void> | null = null;

	const debouncedSave = useDebounceFn(runSave, debounceMs);

	watch(
		edits,
		(newEdits) => {
			if (!enabled.value) return;
			if (Object.keys(newEdits).length === 0) return;

			pendingSave = true;

			// Reset backoff on new edits so an exhausted retry chain doesn't lock out future retries
			clearRetryTimer();
			retryAttempt = 0;

			debouncedSave();
		},
		{ deep: true },
	);

	onScopeDispose(() => {
		clearRetryTimer();
		dismissErrorNotification();
	});

	return {
		autoSaveError,
		isSaving,
		resetOpenRevision,
		flush,
	};

	async function runSave() {
		if (!enabled.value) return;
		if (!pendingSave) return;
		if (isSaving.value) return; // mutex — skip overlapping saves

		clearRetryTimer();

		const forceNewRevision = !hasOpenRevision.value || isRevisionStale();

		isSaving.value = true;
		pendingSave = false; // snapshot — edits arriving during the save re-set this

		currentSave = (async () => {
			try {
				await saveCallback(forceNewRevision);
				hasOpenRevision.value = true;
				autoSaveError.value = null;
				retryAttempt = 0;
				dismissErrorNotification();
			} catch (error) {
				pendingSave = true; // save failed — still dirty
				autoSaveError.value = error instanceof Error ? error : new Error(String(error));
				showErrorNotification();
				scheduleRetry();
			} finally {
				isSaving.value = false;
			}
		})();

		try {
			await currentSave;
		} finally {
			currentSave = null;
		}
	}

	/**
	 * Settle the auto-save queue: flush any pending debounced save and await the in-flight one.
	 * Lets callers (e.g. Publish) queue behind unsaved changes before acting on persisted data.
	 * Throws the auto-save error if a save fails so the caller can abort.
	 */
	async function flush(): Promise<void> {
		if (!enabled.value) return;

		while (pendingSave || isSaving.value) {
			if (currentSave) await currentSave;
			else if (pendingSave) await runSave();
			else break;

			if (autoSaveError.value) throw autoSaveError.value;
		}
	}

	function showErrorNotification() {
		if (errorNotificationId) return;

		errorNotificationId = notificationsStore.add({
			title: t('auto_save_failed'),
			text: t('auto_save_failed_copy'),
			type: 'error',
			icon: 'cloud_off',
			persist: true,
			closeable: true,
			alwaysShowText: true,
			dismissAction: () => {
				errorNotificationId = null;
			},
		});
	}

	function dismissErrorNotification() {
		if (!errorNotificationId) return;
		notificationsStore.remove(errorNotificationId);
		errorNotificationId = null;
	}

	function scheduleRetry() {
		const delay = AUTO_SAVE_RETRY_DELAYS_MS[retryAttempt];
		if (delay === undefined) return; // attempts exhausted — toast stays up until next edit or dismiss
		retryAttempt += 1;

		retryTimer = setTimeout(() => {
			retryTimer = null;
			runSave();
		}, delay);
	}

	function clearRetryTimer() {
		if (!retryTimer) return;
		clearTimeout(retryTimer);
		retryTimer = null;
	}

	function isRevisionStale(): boolean {
		const dateUpdated = currentVersionDateUpdated.value;
		if (!dateUpdated) return true;

		const UNREACHABLE_REVISION_INTERVAL_FALLBACK_SECONDS = 300;
		const collectionOverride = collectionsStore.getCollection(collection.value)?.meta?.autosave_revision_interval;

		const seconds =
			collectionOverride ??
			serverStore.info.autoSave?.revisionInterval ??
			UNREACHABLE_REVISION_INTERVAL_FALLBACK_SECONDS;

		const intervalMs = seconds * 1000;
		return Date.now() - new Date(dateUpdated).getTime() > intervalMs;
	}

	function resetOpenRevision() {
		hasOpenRevision.value = false;
	}
}
