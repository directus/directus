import api from '@/api';
import { ref } from '@vue/composition-api';
import { OpenAPIObject } from 'openapi3-ts';

const spec = ref<OpenAPIObject>();
const loading = ref(false);
const error = ref<any>(null);

export function useSpec() {
	if (loading.value === false && !spec.value) fetchOAS();

	return { spec, loading, error };

	async function fetchOAS() {
		loading.value = true;

		try {
			const response = await api.get('/server/specs/oas');
			spec.value = response.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
