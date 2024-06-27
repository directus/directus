import { emitter, Events } from '@/events';
import { useServerStore } from '@/stores/server';
import { useApi } from '@directus/composables';
import { onMounted, onUnmounted, ref } from 'vue';
import * as tus from 'tus-js-client';

export type PreviousUpload = tus.PreviousUpload & {
	uploadUrl: string;
	progress: number;
};

export function useResumableUploads() {
	const server = useServerStore();
	const loading = ref(false);
	const uploads = ref<PreviousUpload[]>([]);
	const api = useApi();

	if (server.info.uploads) {
		onMounted(() => emitter.on(Events.tusResumableUploadsChanged, refresh));
		onUnmounted(() => emitter.off(Events.tusResumableUploadsChanged, refresh));

		refresh();
	}

	return { uploads, remove };

	async function refresh() {
		const { urlStorage } = tus.defaultOptions;
		const infos = (await urlStorage.findAllUploads()) as PreviousUpload[];

		loading.value = true;

		try {
			const serverInfos = (
				await Promise.allSettled(
					infos.map(({ uploadUrl }) =>
						uploadUrl
							? api.head(uploadUrl, {
									headers: {
										'Tus-Resumable': '1.0.0',
									},
							  })
							: Promise.reject(),
					),
				)
			).map((result) => {
				if (result.status === 'fulfilled') {
					return {
						progress: progressFromHeader(result.value.headers),
					};
				} else {
					return null;
				}
			});

			uploads.value = [];

			serverInfos.forEach((serverInfo, index) => {
				if (serverInfo) {
					uploads.value.push({
						...infos[index],
						...serverInfo,
					});
				} else {
					// Clean up after TUS (this helps this function keep the requests to a minimum on the next call)
					urlStorage.removeUpload(infos[index].urlStorageKey);
				}
			});
		} catch (_) {
			loading.value = false;
		}
	}

	async function remove(urlStorageKey: string) {
		try {
			const info = JSON.parse(localStorage.getItem(urlStorageKey)!);

			if (!info) return;

			await api.delete(info.uploadUrl, {
				headers: {
					'Tus-Resumable': '1.0.0',
				},
			});

			await refresh();
		} catch (_e) {
			// Ignore
		}
	}
}

function progressFromHeader(headers: Record<string, any>) {
	const uploaded = headers['upload-offset'];
	const total = headers['upload-length'];

	if (uploaded && total) {
		return Math.round((uploaded / total) * 100);
	}

	return 0;
}
