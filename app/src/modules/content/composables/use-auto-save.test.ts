import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { AUTO_SAVE_DEBOUNCE_MS, AUTO_SAVE_RETRY_DELAYS_MS, useAutoSave } from './use-auto-save';
import type { SnackbarRaw } from '@/types/notifications';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

const collectionsStoreMock = { getCollection: vi.fn(() => null as any) };
const serverStoreMock = { info: { autoSave: { revisionInterval: 300 } as { revisionInterval: number } | undefined } };
let lastAddedNotification: SnackbarRaw | null = null;

const notificationsStoreMock = {
	add: vi.fn((raw: SnackbarRaw) => {
		lastAddedNotification = raw;
		return 'notification-id';
	}),
	remove: vi.fn(),
};

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => collectionsStoreMock,
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => serverStoreMock,
}));

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: () => notificationsStoreMock,
}));

function setup(opts?: {
	enabled?: boolean;
	debounceMs?: number;
	currentVersionDateUpdated?: string | null;
	saveCallback?: (forceNewRevision: boolean) => Promise<void>;
}) {
	const edits = ref<Record<string, any>>({});
	const dateUpdated = opts?.currentVersionDateUpdated ?? new Date().toISOString();

	const currentVersion = ref<any>({ id: 'v1', key: 'draft', date_updated: dateUpdated });
	const updateVersionsAllowed = ref(opts?.enabled ?? true);
	const collection = ref('articles');

	const saveCallback = vi.fn(opts?.saveCallback ?? (async () => undefined));

	const scope = effectScope();

	const api = scope.run(() =>
		useAutoSave(edits, saveCallback, {
			currentVersion,
			updateVersionsAllowed,
			collection,
			debounceMs: opts?.debounceMs,
		}),
	)!;

	return { edits, currentVersion, updateVersionsAllowed, saveCallback, scope, ...api };
}

beforeEach(() => {
	setActivePinia(createPinia());
	vi.useFakeTimers();
	lastAddedNotification = null;
	notificationsStoreMock.add.mockClear();
	notificationsStoreMock.remove.mockClear();
	collectionsStoreMock.getCollection.mockReset();
	collectionsStoreMock.getCollection.mockReturnValue(null);
	serverStoreMock.info.autoSave = { revisionInterval: 300 };
});

afterEach(() => {
	vi.useRealTimers();
});

async function flushDebounce(ms = AUTO_SAVE_DEBOUNCE_MS) {
	await nextTick();
	await vi.advanceTimersByTimeAsync(ms);
}

describe('useAutoSave', () => {
	describe('basic save flow', () => {
		it('fires the save callback after the debounce window when edits change', async () => {
			const { edits, saveCallback } = setup();

			edits.value = { title: 'hello' };
			await flushDebounce();

			expect(saveCallback).toHaveBeenCalledTimes(1);
		});

		it('does not fire when disabled', async () => {
			const { edits, saveCallback } = setup({ enabled: false });

			edits.value = { title: 'hello' };
			await flushDebounce();

			expect(saveCallback).not.toHaveBeenCalled();
		});

		it('does not fire when edits is empty', async () => {
			const { edits, saveCallback } = setup();

			edits.value = {};
			await flushDebounce();

			expect(saveCallback).not.toHaveBeenCalled();
		});

		it('passes forceNewRevision=true on the first save of the session', async () => {
			const { edits, saveCallback } = setup();

			edits.value = { title: 'hello' };
			await flushDebounce();

			expect(saveCallback).toHaveBeenCalledWith(true);
		});

		it('passes forceNewRevision=false on subsequent saves within the interval', async () => {
			const { edits, saveCallback } = setup();

			edits.value = { title: 'first' };
			await flushDebounce();

			edits.value = { title: 'second' };
			await flushDebounce();

			expect(saveCallback).toHaveBeenNthCalledWith(2, false);
		});
	});

	describe('error notification', () => {
		it('shows a persistent error toast with alwaysShowText when save fails', async () => {
			const error = new Error('boom');
			const { edits } = setup({ saveCallback: () => Promise.reject(error) });

			edits.value = { title: 'hello' };
			await flushDebounce();

			expect(notificationsStoreMock.add).toHaveBeenCalledTimes(1);

			expect(lastAddedNotification).toMatchObject({
				title: 'auto_save_failed',
				text: 'auto_save_failed_copy',
				type: 'error',
				icon: 'cloud_off',
				persist: true,
				closeable: true,
				alwaysShowText: true,
			});

			expect(typeof lastAddedNotification!.dismissAction).toBe('function');
		});

		it('does not stack a second toast while one is already showing', async () => {
			const { edits } = setup({ saveCallback: () => Promise.reject(new Error('boom')) });

			edits.value = { title: 'a' };
			await flushDebounce();
			edits.value = { title: 'ab' };
			await flushDebounce();

			expect(notificationsStoreMock.add).toHaveBeenCalledTimes(1);
		});

		it('dismissAction clears the stored id so the next failure can surface a fresh toast', async () => {
			const { edits } = setup({ saveCallback: () => Promise.reject(new Error('boom')) });

			edits.value = { title: 'a' };
			await flushDebounce();
			expect(notificationsStoreMock.add).toHaveBeenCalledTimes(1);

			// User dismisses — fires dismissAction
			lastAddedNotification!.dismissAction!();

			edits.value = { title: 'ab' };
			await flushDebounce();

			expect(notificationsStoreMock.add).toHaveBeenCalledTimes(2);
		});

		it('removes the toast on the next successful save', async () => {
			const saveCallback = vi
				.fn<(forceNewRevision: boolean) => Promise<void>>()
				.mockRejectedValueOnce(new Error('boom'))
				.mockResolvedValueOnce(undefined);

			const { edits } = setup({ saveCallback });

			edits.value = { title: 'a' };
			await flushDebounce();
			expect(notificationsStoreMock.add).toHaveBeenCalledTimes(1);

			edits.value = { title: 'ab' };
			await flushDebounce();

			expect(notificationsStoreMock.remove).toHaveBeenCalledWith('notification-id');
		});
	});

	describe('retry backoff', () => {
		it('retries with delays 5s, 15s, 30s after a failed save', async () => {
			const saveCallback = vi.fn<(forceNewRevision: boolean) => Promise<void>>().mockRejectedValue(new Error('boom'));
			const { edits } = setup({ saveCallback });

			edits.value = { title: 'hello' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(1);

			// First retry after 5s
			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[0]!);
			expect(saveCallback).toHaveBeenCalledTimes(2);

			// Second retry after 15s
			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[1]!);
			expect(saveCallback).toHaveBeenCalledTimes(3);

			// Third retry after 30s
			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[2]!);
			expect(saveCallback).toHaveBeenCalledTimes(4);
		});

		it('stops retrying after the bounded chain is exhausted', async () => {
			const saveCallback = vi.fn<(forceNewRevision: boolean) => Promise<void>>().mockRejectedValue(new Error('boom'));
			const { edits } = setup({ saveCallback });

			edits.value = { title: 'hello' };
			await flushDebounce();

			for (const delay of AUTO_SAVE_RETRY_DELAYS_MS) {
				await vi.advanceTimersByTimeAsync(delay);
			}

			expect(saveCallback).toHaveBeenCalledTimes(1 + AUTO_SAVE_RETRY_DELAYS_MS.length);

			// One more full minute — no further retries.
			await vi.advanceTimersByTimeAsync(60_000);
			expect(saveCallback).toHaveBeenCalledTimes(1 + AUTO_SAVE_RETRY_DELAYS_MS.length);
		});

		it('resets the retry chain after a successful save', async () => {
			const saveCallback = vi
				.fn<(forceNewRevision: boolean) => Promise<void>>()
				.mockRejectedValueOnce(new Error('boom'))
				.mockResolvedValueOnce(undefined)
				.mockRejectedValue(new Error('boom again'));

			const { edits } = setup({ saveCallback });

			edits.value = { title: 'a' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(1); // failed

			// User keeps typing, succeeds
			edits.value = { title: 'ab' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(2);

			// New failure should start retry chain at 5s, not at exhausted state
			edits.value = { title: 'abc' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(3);

			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[0]!);
			expect(saveCallback).toHaveBeenCalledTimes(4);
		});

		it('cancels a pending retry when the user edits again', async () => {
			const saveCallback = vi
				.fn<(forceNewRevision: boolean) => Promise<void>>()
				.mockRejectedValueOnce(new Error('boom'))
				.mockResolvedValue(undefined);

			const { edits } = setup({ saveCallback });

			edits.value = { title: 'a' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(1);

			// User edits during the 5s retry window
			edits.value = { title: 'ab' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(2);

			// Pending 5s retry should have been cancelled — advancing time fires nothing extra
			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[0]!);
			expect(saveCallback).toHaveBeenCalledTimes(2);
		});
	});

	describe('cleanup', () => {
		it('clears the pending retry and dismisses the toast when the scope is disposed', async () => {
			const saveCallback = vi.fn<(forceNewRevision: boolean) => Promise<void>>().mockRejectedValue(new Error('boom'));
			const { edits, scope } = setup({ saveCallback });

			edits.value = { title: 'a' };
			await flushDebounce();
			expect(saveCallback).toHaveBeenCalledTimes(1);

			scope.stop();

			expect(notificationsStoreMock.remove).toHaveBeenCalledWith('notification-id');

			// Pending retry should have been cleared by clearRetryTimer in onScopeDispose
			await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_DELAYS_MS[0]!);
			expect(saveCallback).toHaveBeenCalledTimes(1);
		});
	});
});
