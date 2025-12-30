import { Collection, PrimaryKey } from '../../types';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ItemPermissions } from '@directus/types';
import { computedAsync } from '@vueuse/core';
import { ref, unref } from 'vue';

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
	const refreshKey = ref(0);

	const fetchedItemPermissions = computedAsync(
		async () => {
			void refreshKey.value;

			const primaryKeyValue = unref(primaryKey);

			try {
				const response = await api.get<{ data: ItemPermissions }>(
					`/permissions/me/${unref(collection)}${
						primaryKeyValue !== null ? `/${encodeURIComponent(primaryKeyValue)}` : ''
					}`,
				);

				return response.data.data;
			} catch (error) {
				unexpectedError(error);

				// Optimistic in case of errors to not block UI
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

	const refresh = () => refreshKey.value++;

	return { loading, refresh, fetchedItemPermissions };
};
