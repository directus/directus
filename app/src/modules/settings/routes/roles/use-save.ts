import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useLicenseStore } from '@/stores/license';
import { unexpectedError } from '@/utils/unexpected-error';

export interface UseSaveOptions {
	name: Ref<string | null>;
}

export function useSave({ name }: UseSaveOptions) {
	const router = useRouter();

	const saving = ref(false);

	return { saving, save };

	async function save() {
		if (name.value === null || saving.value) return;

		saving.value = true;

		const licenseStore = useLicenseStore();

		try {
			const roleResponse = await api.post('/roles', {
				name: name.value,
			});

			licenseStore.hydrate();
			router.push({ name: 'settings-roles-item', params: { primaryKey: roleResponse.data.data.id } });
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
	}
}
