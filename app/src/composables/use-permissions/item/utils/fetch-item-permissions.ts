import { ItemPermissions } from '@directus/types';
import { computedAsync } from '@vueuse/core';
import { ref, unref } from 'vue';
import { Collection, PrimaryKey } from '../../types';
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
	const refreshKey = ref(0);
	const requestKey = ref(0);
	const latestPermissions = ref<ItemPermissions>(defaultPermissions);

	const fetchedItemPermissions = computedAsync(
		async () => {
			void refreshKey.value;

			const primaryKeyValue = unref(primaryKey);
			const currentRequest = ++requestKey.value;

			if (primaryKeyValue === undefined) {
				return latestPermissions.value;
			}

			try {
				const response = await api.get<{ data: ItemPermissions }>(
					`/permissions/me/${unref(collection)}${
						primaryKeyValue !== null ? `/${encodeURIComponent(primaryKeyValue)}` : ''
					}`,
				);

				if (currentRequest !== requestKey.value) {
					return latestPermissions.value;
				}

				latestPermissions.value = response.data.data;
				return response.data.data;
			} catch (error) {
				if (currentRequest !== requestKey.value) {
					return latestPermissions.value;
				}

				unexpectedError(error);

				// Optimistic in case of errors to not block UI
				const optimisticPermissions = {
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

				latestPermissions.value = optimisticPermissions;
				return optimisticPermissions;
			}
		},
		defaultPermissions,
		{ lazy: true, evaluating: loading },
	);

	const refresh = () => refreshKey.value++;

	return { loading, refresh, fetchedItemPermissions };
};
