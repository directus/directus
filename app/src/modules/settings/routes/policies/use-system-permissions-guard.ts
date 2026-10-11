import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import type { SystemPermissionChange } from './get-system-permission-changes';
import { unexpectedError } from '@/utils/unexpected-error';

/**
 * Holds back a save while it would grant public access to system collections, until the user confirms it.
 * The changes are resolved when a save is requested, so they can depend on data fetched at that point.
 */
export function useSystemPermissionsGuard(
	getChanges: () => SystemPermissionChange[] | Promise<SystemPermissionChange[]>,
	saving: Ref<boolean>,
) {
	const pendingSave = ref<(() => Promise<void>) | null>(null);
	const changes = ref<SystemPermissionChange[]>([]);
	const checking = ref(false);

	const confirmSystemPermissions = computed({
		get: () => pendingSave.value !== null,
		set: (value) => {
			if (!value) {
				pendingSave.value = null;
			}
		},
	});

	return { confirmSystemPermissions, changes, checking, guardSave, confirmSave };

	async function guardSave(saveFn: () => Promise<void>) {
		if (saving.value || checking.value) {
			return;
		}

		checking.value = true;

		try {
			changes.value = await getChanges();
		} catch (error) {
			unexpectedError(error);
			return;
		} finally {
			checking.value = false;
		}

		if (changes.value.length === 0) {
			saveFn();
			return;
		}

		pendingSave.value = saveFn;
	}

	async function confirmSave() {
		if (saving.value) {
			return;
		}

		await pendingSave.value?.();
		pendingSave.value = null;
	}
}
