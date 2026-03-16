import type { Permission, Policy } from '@directus/types';
import type { Ref } from 'vue';
import { ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export type PolicyItem = Policy & {
	userCount?: number;
	roleCount?: number;
};

export interface UseDuplicateOptions {
	source: Ref<PolicyItem | null>;
	name: Ref<string>;
	onSuccess: () => void | Promise<void>;
}

export function useDuplicate({ source, name, onSuccess }: UseDuplicateOptions) {
	const duplicating = ref(false);

	return { duplicating, duplicate };

	async function duplicate() {
		if (!source.value || !name.value || duplicating.value) return;

		const item = source.value;
		duplicating.value = true;

		try {
			const permissionsResponse = await api.get('/permissions', {
				params: {
					filter: { policy: { _eq: item.id } },
					limit: -1,
					fields: ['collection', 'action', 'permissions', 'validation', 'presets', 'fields', 'policy'],
				},
			});

			const permissions: Permission[] = permissionsResponse.data.data;

			const newPolicyResponse = await api.post('/policies', {
				name: name.value,
				icon: item.icon,
				description: item.description,
				enforce_tfa: item.enforce_tfa,
				ip_access: item.ip_access,
				app_access: item.app_access,
				admin_access: item.admin_access,
			});

			const newPolicyId: string = newPolicyResponse.data.data.id;

			if (permissions.length > 0) {
				await api.post(
					'/permissions',
					permissions.map((p) => ({ ...p, policy: newPolicyId })),
				);
			}

			await onSuccess();
		} catch (error) {
			unexpectedError(error);
		} finally {
			duplicating.value = false;
		}
	}
}
