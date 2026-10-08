import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import type { SystemPermissionChange } from './get-system-permission-changes';

/**
 * Holds back a save while it would grant public access to system collections, until the user confirms it.
 */
export function useSystemPermissionsGuard(changes: Ref<SystemPermissionChange[]>, saving: Ref<boolean>) {
	const pendingSave = ref<(() => Promise<void>) | null>(null);

	const confirmSystemPermissions = computed({
		get: () => pendingSave.value !== null,
		set: (value) => {
			if (!value) {
				pendingSave.value = null;
			}
		},
	});

	return { confirmSystemPermissions, guardSave, confirmSave };

	function guardSave(saveFn: () => Promise<void>) {
		if (saving.value) {
			return;
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
