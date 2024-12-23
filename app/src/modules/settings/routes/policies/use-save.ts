import api from '@/api';
import { appRecommendedPermissions } from '@/app-permissions.js';
import { unexpectedError } from '@/utils/unexpected-error';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

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
					appRecommendedPermissions.map((permission) => ({
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
