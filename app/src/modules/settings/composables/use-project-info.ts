import api from '@/api';
import { computed, ComputedRef, ref, Ref } from 'vue';

type ServerInfo = {
	directus: {
		version: string;
	};
};

type UsableProjectInfo = {
	info: Ref<ServerInfo | undefined>;
	parsedInfo: ComputedRef<{
		directus: {
			version: string;
		};
	} | null>;
	loading: Ref<boolean>;
	error: Ref<any>;
};

export function useProjectInfo(): UsableProjectInfo {
	const info = ref<ServerInfo>();
	const loading = ref(false);
	const error = ref<any>();

	const parsedInfo = computed(() => {
		if (!info.value) return null;

		return {
			directus: {
				version: info.value.directus.version,
			},
		};
	});

	if (!info.value) {
		fetchInfo();
	}

	return { info, parsedInfo, loading, error };

	async function fetchInfo() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.get('/server/info');
			info.value = response.data.data;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
