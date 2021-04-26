import { ref, computed, Ref } from '@vue/composition-api';
import prettyMS from 'pretty-ms';
import bytes from 'bytes';
import api from '@/api';

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

export function useProjectInfo(): Record<string, Ref> {
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
				totalmem: bytes(info.value.os.totalmem),
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
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
