import api from '@/api';
import prettyBytes from 'pretty-bytes';
import prettyMS from 'pretty-ms';
import { computed, ComputedRef, ref, Ref } from 'vue';

type ServerInfo = {
	directus: {
		version: string;
	};
	node: {
		version: string;
		uptime: number;
	};
	os: {
		type: string;
		version: string;
		uptime: number;
		totalmem: number;
	};
};

type UsableProjectInfo = {
	info: Ref<ServerInfo | undefined>;
	parsedInfo: ComputedRef<{
		directus: {
			version: string;
		};
		node: {
			version: string;
			uptime: string;
		};
		os: {
			type: string;
			version: string;
			uptime: string;
			totalmem: string;
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
			node: {
				version: info.value.node.version,
				uptime: prettyMS(info.value.node.uptime * 1000),
			},
			os: {
				type: info.value.os.type,
				version: info.value.os.version,
				uptime: prettyMS(info.value.os.uptime * 1000),
				totalmem: prettyBytes(info.value.os.totalmem),
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
