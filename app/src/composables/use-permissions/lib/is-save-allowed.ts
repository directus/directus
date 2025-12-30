import { IsNew } from '../types';
import { computed, ComputedRef, unref } from 'vue';

export const isSaveAllowed = (isNew: IsNew, createAllowed: ComputedRef<boolean>, updateAllowed: ComputedRef<boolean>) =>
	computed(() => {
		if (unref(isNew)) {
			return createAllowed.value;
		}

		return updateAllowed.value;
	});
