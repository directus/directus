import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { getEndpoint } from '@directus/utils';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFeatureFlagStore = defineStore('featureFlagStore', () => {
	const showWebhooks = ref<boolean>(false);

	return {
		showWebhooks,
		hydrate,
		dehydrate,
	};

	async function hydrate() {
		const { hasPermission } = usePermissionsStore();

		if (!hasPermission('directus_webhooks', 'read')) {
			showWebhooks.value = false;
		} else {
			try {
				const response = await api.get(getEndpoint('directus_webhooks'), {
					params: { limit: 1, fields: 'id' },
				});

				showWebhooks.value = response.data?.data?.length > 0;
			} catch (err) {
				showWebhooks.value = false;
			}
		}
	}

	async function dehydrate() {
		showWebhooks.value = false;
	}
});
