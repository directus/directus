import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

/**
 * Whether the policy is attached to the Public role, matching how the API resolves public access:
 * a `directus_access` row for the policy with neither a role nor a user.
 */
export function useIsAttachedToPublicRole(primaryKey: Ref<string>) {
	const isAttachedToPublicRole = ref(false);

	watch(primaryKey, fetchIsAttachedToPublicRole, { immediate: true });

	return isAttachedToPublicRole;

	async function fetchIsAttachedToPublicRole(policy: string) {
		try {
			const response = await api.get<{ data: { id: string }[] }>('/access', {
				params: {
					filter: {
						_and: [{ policy: { _eq: policy } }, { role: { _null: true } }, { user: { _null: true } }],
					},
					fields: ['id'],
					limit: 1,
				},
			});

			isAttachedToPublicRole.value = response.data.data.length > 0;
		} catch (error) {
			isAttachedToPublicRole.value = false;
			unexpectedError(error);
		}
	}
}
