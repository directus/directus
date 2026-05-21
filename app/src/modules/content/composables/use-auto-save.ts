import { useDebounceFn } from '@vueuse/core';
import { onScopeDispose, ref, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { useServerStore } from '@/stores/server';

/** Fallback when neither the collection nor the server reports a value. Seconds of inactivity after which the next save creates a new revision instead of updating in-place. */
export const AUTO_SAVE_SNAPSHOT_INTERVAL_SECONDS_FALLBACK = 300;
export const AUTO_SAVE_DEBOUNCE_MS = 300;
/** Bounded backoff used to retry after a failed auto-save when the user has stopped typing. */
export const AUTO_SAVE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000];

export interface UseAutoSaveOptions {
	/** Auto-save only fires when this is true (e.g. currentVersion !== null && hasPermission). */
	enabled: Ref<boolean>;
	/** date_updated of the currently-active version record, used to check revision freshness. */
	currentVersionDateUpdated: Ref<string | null>;
	/** Collection name — used to read per-collection `autosave_revision_interval` override. */
	collection: Ref<string>;
	/** Debounce delay in milliseconds. Default: 300. */
	debounceMs?: number;
}

export function useAutoSave(
	edits: Ref<Record<string, any>>,
	saveCallback: (forceNewRevision: boolean) => Promise<void>,
	options: UseAutoSaveOptions,
) {
	const { enabled, currentVersionDateUpdated, collection, debounceMs = AUTO_SAVE_DEBOUNCE_MS } = options;
	const serverStore = useServerStore();
	const collectionsStore = useCollectionsStore();
	const notificationsStore = useNotificationsStore();
	const { t } = useI18n();

	const isSaving = ref(false);
	const sessionHasSaved = ref(false);
	const autoSaveError = ref<Error | null>(null);
	let errorNotificationId: string | null = null;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let retryAttempt = 0;

	const debouncedSave = useDebounceFn(runSave, debounceMs);

	async function runSave() {
		if (!enabled.value) return;
		if (Object.keys(edits.value).length === 0) return;
		if (isSaving.value) return; // mutex — skip overlapping saves

		clearRetryTimer();

		const forceNewRevision = !sessionHasSaved.value || isRevisionStale();

		isSaving.value = true;

		try {
			await saveCallback(forceNewRevision);
			sessionHasSaved.value = true;
			autoSaveError.value = null;
			retryAttempt = 0;
			dismissErrorNotification();
		} catch (error) {
			autoSaveError.value = error instanceof Error ? error : new Error(String(error));
			showErrorNotification();
			scheduleRetry();
		} finally {
			isSaving.value = false;
		}
	}

	watch(
		edits,
		(newEdits) => {
			if (!enabled.value) return;
			if (Object.keys(newEdits).length === 0) return;
			// User is editing again — cancel any pending retry and reset the backoff so an exhausted
			// chain doesn't permanently skip retries on subsequent failures.
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

		const collectionOverride = collectionsStore.getCollection(collection.value)?.meta?.autosave_revision_interval;

		const seconds =
			collectionOverride ?? serverStore.info.autoSave?.revisionInterval ?? AUTO_SAVE_SNAPSHOT_INTERVAL_SECONDS_FALLBACK;

		const intervalMs = seconds * 1000;
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
