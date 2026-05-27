import { DEFAULT_CHUNK_SIZE } from '@directus/constants';
import type { File } from '@directus/types';
import type { AxiosProgressEvent } from 'axios';
import type { PreviousUpload } from 'tus-js-client';
import { Upload } from 'tus-js-client';
import { unexpectedError } from './unexpected-error';
import api from '@/api';
import { emitter, Events } from '@/events';
import { i18n } from '@/lang';
import { useServerStore } from '@/stores/server';
import { getRootPath } from '@/utils/get-root-path';
import { notify } from '@/utils/notify';

export async function uploadFile(
	file: globalThis.File,
	options?: {
		onProgressChange?: (percentage: number) => void;
		onChunkedUpload?: (controller: Upload) => void;
		notifications?: boolean;
		preset?: Partial<File>;
		fileId?: string;
		requirePreviousUpload?: boolean;
	},
): Promise<File | undefined> {
	const progressHandler = options?.onProgressChange || (() => undefined);

	const server = useServerStore();
	let notified = false;

	if (server.info.uploads?.tus === true) {
		const fileInfo: Partial<File> = { ...(options?.preset ?? {}) };

		if (options?.fileId) {
			fileInfo.id = options?.fileId;
		}

		fileInfo.filename_download = file.name;
		fileInfo.type = file.type;

		return new Promise((resolve, reject) => {
			const upload = new Upload(file, {
				endpoint: getRootPath() + `files/tus`,
				chunkSize: server.info.uploads?.chunkSize ?? DEFAULT_CHUNK_SIZE,
				metadata: fileInfo as Record<string, string>,
				// Allow user to re-upload of the same file
				// https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
				removeFingerprintOnSuccess: true,
				onBeforeRequest(req) {
					const xml = req.getUnderlyingObject();
					xml.withCredentials = true;
				},
				onError(error) {
					reject(error);
					emitter.emit(Events.tusResumableUploadsChanged);
				},
				onProgress(bytesUploaded, bytesTotal) {
					const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2));
					progressHandler(percentage);

					if (!notified) {
						emitter.emit(Events.tusResumableUploadsChanged);
						notified = true;
					}
				},
				async onSuccess() {
					if (options?.notifications) {
						notify({
							title: i18n.global.t('upload_file_success'),
						});
					}

					emitter.emit(Events.upload);
					emitter.emit(Events.tusResumableUploadsChanged);

					const response = await api.get(`files/${fileInfo.id}`);

					if (response) {
						resolve(response.data.data);
					} else {
						resolve(fileInfo as File);
					}
				},
				onShouldRetry() {
					return false;
				},
				onAfterResponse(_req, res) {
					fileInfo.id ??= res.getHeader('Directus-File-Id');
				},
			});

			options?.onChunkedUpload?.({
				start() {
					upload.start();
				},
				abort: () => {
					upload.abort();
					// Notify listeners that the upload was aborted/paused
					emitter.emit(Events.tusResumableUploadsChanged);
				},
			});

			// Check if there are any previous uploads to continue.
			upload.findPreviousUploads().then((previousUploads: PreviousUpload[]) => {
				// Found previous uploads so we select the first one.
				if (previousUploads.length > 0) {
					upload.resumeFromPreviousUpload(previousUploads[0]!);
					fileInfo.id = previousUploads[0]!.metadata['id'];
				}

				// Start the upload
				upload.start();
			});
		});
	} else {
		const formData = new FormData();

		if (options?.preset) {
			for (const [key, value] of Object.entries(options.preset)) {
				formData.append(key, value);
			}
		}

		formData.append('file', file);

		try {
			let response = null;

			if (options?.fileId) {
				response = await api.patch(`/files/${options.fileId}`, formData, {
					onUploadProgress,
				});
			} else {
				response = await api.post(`/files`, formData, {
					onUploadProgress,
				});
			}

			if (options?.notifications) {
				notify({
					title: i18n.global.t('upload_file_success'),
				});
			}

			emitter.emit(Events.upload);

			return response.data.data;
		} catch (error) {
			unexpectedError(error);
		}

		return;
	}

	function onUploadProgress(progressEvent: AxiosProgressEvent) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total!);
		progressHandler(percentCompleted);
	}
}
