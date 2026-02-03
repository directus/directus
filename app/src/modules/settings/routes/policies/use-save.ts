import { appAccessMinimalPermissions } from '@directus/system-data';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export interface UseSaveOptions {
	name: Ref<string | null>;
	adminAccess: Ref<boolean>;
	appAccess: Ref<boolean>;
}

export function useSave({ name, adminAccess, appAccess }: UseSaveOptions) {
	const router = useRouter();

	const saving = ref(false);

	return { saving, save };

	async function save() {
		if (name.value === null || saving.value) return;

		saving.value = true;

		try {
			const policyResponse = await api.post('/policies', {
				name: name.value,
				admin_access: adminAccess.value,
				app_access: appAccess.value,
			});

			if (appAccess.value === true && adminAccess.value === false) {
				await api.post(
					'/permissions',
					appAccessMinimalPermissions.map((permission) => ({
						...permission,
						policy: policyResponse.data.data.id,
					})),
				);
			}

			router.push(`/settings/policies/${policyResponse.data.data.id}`);
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
	}
}
