import { emitter, Events } from '@/events';
import { useServerStore } from '@/stores/server';
import { useApi } from '@directus/composables';
import { onMounted, onUnmounted, ref } from 'vue';
import * as tus from 'tus-js-client';

export type PreviousUpload = tus.PreviousUpload & {
	uploadUrl: string;
};

export function useResumableUploads() {
	const server = useServerStore();
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

		const serverAvailability = (
			await Promise.allSettled(
				infos.map(({ uploadUrl }) =>
					uploadUrl
						? api.head(uploadUrl, {
								headers: {
									'Tus-Resumable': '1.0.0',
								},
						  })
						: Promise.resolve(null),
				),
			)
		).map((result) => result.status === 'fulfilled');

		uploads.value = [];

		serverAvailability.forEach((available, index) => {
			if (available) {
				uploads.value.push(infos[index]);
			} else {
				// Clean up after TUS (this helps this function keep the requests to a minimum on the next call)
				urlStorage.removeUpload(infos[index].urlStorageKey);
			}
		});
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
		} catch (_e) {
			// Ignore
		}
	}
}
