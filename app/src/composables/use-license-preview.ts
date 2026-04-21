import { ref } from 'vue';
import api from '@/api';

export function useLicensePreview() {
	const previewPayload = ref<Record<string, any> | null>(null);
	const validating = ref(false);
	const validationError = ref<string | null>(null);
	let requestId = 0;

	async function fetchPreview(key: string) {
		const currentRequestId = ++requestId;
		validating.value = true;

		try {
			const response = await api.post('/server/license/check', { license_key: key });

			if (currentRequestId !== requestId) return;

			previewPayload.value = response.data.data ?? null;
			validationError.value = null;
		} catch (error: any) {
			if (currentRequestId !== requestId) return;

			previewPayload.value = null;
			validationError.value = error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Validation failed';
		} finally {
			if (currentRequestId === requestId) {
				validating.value = false;
			}
		}
	}

	function clearPreview() {
		requestId++;
		validating.value = false;
		previewPayload.value = null;
		validationError.value = null;
	}

	return { previewPayload, validating, validationError, fetchPreview, clearPreview };
}
