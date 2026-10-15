import type { Item } from '@directus/types';
import { isEmpty, omit, pick } from 'lodash-es';
import { computed, type Ref, ref } from 'vue';

export function useVersionConflict(edits: Ref<Item>, item: Ref<Item | null>) {
	const conflictingEdits = ref<Item | null>(null);

	const versionConflict = computed(() => {
		if (!conflictingEdits.value) return undefined;

		const latest = { ...item.value, ...edits.value };

		return { from: latest, to: { ...latest, ...conflictingEdits.value } };
	});

	return { versionConflict, handleVersionConflict, clearVersionConflict };

	function handleVersionConflict(error: unknown): boolean {
		if (!error || typeof error !== 'object' || !('versionConflict' in error)) return false;

		const { fields } = (error as { versionConflict: { fields: string[] } }).versionConflict;
		const stashed = pick(edits.value, fields);

		if (isEmpty(stashed)) return true;

		conflictingEdits.value = { ...conflictingEdits.value, ...stashed };
		edits.value = omit(edits.value, fields);

		return true;
	}

	function clearVersionConflict() {
		conflictingEdits.value = null;
	}
}
