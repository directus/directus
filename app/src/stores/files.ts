import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

type Upload = {
	numberOfFiles: number;
	progress: number;
	done: number; // number of files completed
};

export const useFilesStore = defineStore('filesStore', () => {
	// Each entry represents an upload, which can contain one or multiple uploads
	const activeUploads = reactive(new Map<string, Upload>());
	const isAnyUploadActive = computed(() => activeUploads.size > 0);

	return {
		isAnyUploadActive,
		upload,
	};

	function upload() {
		const id = nanoid();

		const uploading = computed(() => activeUploads.has(id));
		const numberOfFiles = computed(() => activeUploads.get(id)?.numberOfFiles ?? 0);

		const progress = computed({
			get() {
				return activeUploads.get(id)?.progress ?? 0;
			},
			set(value: number) {
				const entry = activeUploads.get(id);
				if (entry) entry.progress = value;
			},
		});

		const done = computed({
			get() {
				return activeUploads.get(id)?.done ?? 0;
			},
			set(value: number) {
				const entry = activeUploads.get(id);
				if (entry) entry.done = value;
			},
		});

		return { start, finish, numberOfFiles, uploading, progress, done };

		function finish() {
			activeUploads.delete(id);
		}

		function start(numberOfFiles: number) {
			activeUploads.set(id, { numberOfFiles, progress: 0, done: 0 });
		}
	}
});
