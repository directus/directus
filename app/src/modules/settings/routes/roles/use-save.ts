import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
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

		try {
			const roleResponse = await api.post('/roles', {
				name: name.value,
			});

			router.push(`/settings/roles/${roleResponse.data.data.id}`);
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
	}
}
