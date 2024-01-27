import { ref, unref } from 'vue';
import { computedAsync } from '@vueuse/core';
import { ItemPermissions } from '@directus/types';
import { Collection, PrimaryKey } from '../types';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

const defaultPermissions: ItemPermissions = {
	update: {
		access: false,
	},
	delete: {
		access: false,
	},
	share: {
		access: false,
	},
};

export const fetchItemPermissions = (collection: Collection, primaryKey: PrimaryKey) => {
	const loading = ref(false);

	const fetchedItemPermissions = computedAsync(
		async () => {
			const pk = unref(primaryKey);

			if (!pk) return defaultPermissions;

			try {
				const response = await api.get<{ data: ItemPermissions }>(`/permissions/me/${unref(collection)}/${pk}`);
				return response.data.data;
			} catch (error) {
				unexpectedError(error);

				// Be optimistic in case of errors to not block UI operations
				return {
					update: {
						access: true,
					},
					delete: {
						access: true,
					},
					share: {
						access: true,
					},
				};
			}
		},
		defaultPermissions,
		{ lazy: true, evaluating: loading },
	);

	return { loading, fetchedItemPermissions };
};
