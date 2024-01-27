import { Ref, computed, unref } from 'vue';
import { IsNew } from '../types';

export const isSaveAllowed = (isNew: IsNew, createAllowed: Ref<boolean>, updateAllowed: Ref<boolean>) =>
	computed(() => {
		if (unref(isNew)) {
			return createAllowed.value;
		}

		return updateAllowed.value;
	});
