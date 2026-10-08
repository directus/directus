import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

/**
 * Whether the policy is attached to the Public role, matching how the API resolves public access:
 * a `directus_access` row for the policy with neither a role nor a user.
 * `null` while unknown (loading or failed), so callers can fail closed.
 */
export function useIsAttachedToPublicRole(primaryKey: Ref<string>) {
	const isAttachedToPublicRole = ref<boolean | null>(null);

	watch(
		primaryKey,
		async (policy, _previous, onCleanup) => {
			let stale = false;

			onCleanup(() => {
				stale = true;
			});

			isAttachedToPublicRole.value = null;

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

				if (!stale) {
					isAttachedToPublicRole.value = response.data.data.length > 0;
				}
			} catch (error) {
				if (!stale) {
					unexpectedError(error);
				}
			}
		},
		{ immediate: true },
	);

	return isAttachedToPublicRole;
}
