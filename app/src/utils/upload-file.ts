import api from '@/api';
import { emitter, Events } from '@/events';
import { i18n } from '@/lang';
import { useServerStore } from '@/stores/server';
import { notify } from '@/utils/notify';
import type { AxiosProgressEvent } from 'axios';
import { unexpectedError } from './unexpected-error';
import * as tus from 'tus-js-client';

export async function uploadFile(
	file: File,
	options?: {
		onProgressChange?: (percentage: number) => void;
		onChunkedUpload?: (controller: tus.Upload) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		fileId?: string;
		requirePreviousUpload?: boolean;
	},
): Promise<any> {
	const progressHandler = options?.onProgressChange || (() => undefined);

	const server = useServerStore();
	let notified = false;

	if (server.info.uploads) {
		const fileInfo: Record<string, any> = {
			filename: file.name,
			filetype: file.type,
		};

		if (options?.preset) {
			for (const [key, value] of Object.entries(options.preset)) {
				fileInfo[key] = value;
			}
		}

		return new Promise((resolve, reject) => {
			//-------------------------------
			// Create a new tus upload
			const upload = new tus.Upload(file, {
				// urlStorage: getReactiveUrlStorage(),
				endpoint: '/files/tus',
				// retryDelays: [0, 3000, 5000, 10000, 20000],
				chunkSize: server.info.uploads?.chunkSize ?? 10_000_000,
				metadata: fileInfo,
				// Allow user to re-upload of the same file
				// https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
				removeFingerprintOnSuccess: true,
				onBeforeRequest(req) {
					const xml = req.getUnderlyingObject();
					xml.withCredentials = true;
				},
				onError(error) {
					// console.log('Failed because: ' + error);
					reject(error);
					emitter.emit(Events.tusResumableUploadsChanged);
				},
				onProgress(bytesUploaded, bytesTotal) {
					const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2));
					progressHandler(percentage);
					//   console.log(bytesUploaded, bytesTotal, percentage + '%')

					if (!notified) {
						emitter.emit(Events.tusResumableUploadsChanged);
						notified = true;
					}
				},
				onSuccess() {
					//   console.log('Download %s from %s', upload.file.name, upload.url)

					if (options?.notifications) {
						notify({
							title: i18n.global.t('upload_file_success'),
						});
					}

					emitter.emit(Events.upload);
					emitter.emit(Events.tusResumableUploadsChanged);

					resolve(fileInfo);
				},
				onShouldRetry() {
					return false;
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
			upload.findPreviousUploads().then((previousUploads: tus.PreviousUpload[]) => {
				console.log('prev', previousUploads);

				// Found previous uploads so we select the first one.
				if (previousUploads.length > 0) {
					upload.resumeFromPreviousUpload(previousUploads[0]!);
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
	}

	function onUploadProgress(progressEvent: AxiosProgressEvent) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total!);
		progressHandler(percentCompleted);
	}
}
