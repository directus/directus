import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { uploadFile } from '@/utils/upload-file';
import type { File } from '@directus/types';
import PQueue from 'p-queue';
import type { Upload } from 'tus-js-client';
import { unexpectedError } from './unexpected-error';

export async function uploadFiles(
	files: globalThis.File[],
	options?: {
		onProgressChange?: (percentages: number[]) => void;
		onChunkedUpload?: (controllers: (Upload | null)[]) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		folder?: string;
		maxConcurrency?: number;
	},
): Promise<(File | undefined)[]> {
	const progressHandler = options?.onProgressChange || (() => undefined);
	const progressForFiles = files.map(() => 0);
	const uploadControllers: (Upload | null)[] = Array(files.length).fill(null);

	const uploadQueue = new PQueue({
		concurrency: options?.maxConcurrency && options.maxConcurrency > 0 ? options.maxConcurrency : Infinity,
	});

	const startUpload = (file: globalThis.File, index: number) =>
		uploadFile(file, {
			...options,
			onProgressChange: (percentage: number) => {
				progressForFiles[index] = percentage;
				progressHandler(progressForFiles);
			},
			onChunkedUpload: (controller: Upload) => {
				uploadControllers[index] = controller;
				options?.onChunkedUpload?.(uploadControllers);
			},
		});

	try {
		const uploadedFiles = (
			await Promise.all(
				files.map((file, index) => uploadQueue.add(() => startUpload(file, index), { throwOnTimeout: true })),
			)
		).filter((v) => v);

		if (options?.notifications) {
			notify({
				title: i18n.global.t('upload_files_success', { count: files.length }),
			});
		}

		return uploadedFiles;
	} catch (error) {
		unexpectedError(error);
	}

	return [];
}
