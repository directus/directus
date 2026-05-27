import { ref } from 'vue';
import api from '@/api';
import { extractPath, getPublicURL } from '@/utils/get-root-path';

export function useSafeRedirect() {
	const redirect = ref<string | null>(null);

	async function resolveRedirect(value: string | undefined | null, provider?: string) {
		if (!value) return;

		try {
			const response = await api.post('/utils/resolve-redirect', { redirect: value, provider });
			redirect.value = toRelativePath(response.data?.data);
		} catch {
			redirect.value = null;
		}
	}

	function toRelativePath(resolved: string | null): string | null {
		if (!resolved) return null;

		// Only attempt conversion for absolute URLs
		if (/^https?:\/\//.test(resolved) === false) return resolved;

		try {
			const resolvedUrl = new URL(resolved);
			const publicBase = new URL(getPublicURL());

			if (resolvedUrl.protocol === publicBase.protocol && resolvedUrl.host === publicBase.host) {
				return extractPath(resolvedUrl.toString());
			}
		} catch {
			// Not a valid URL, return as-is
		}

		return resolved;
	}

	return { redirect, resolveRedirect };
}
