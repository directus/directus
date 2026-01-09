import type { File } from '@directus/types';
import type { Upload } from 'tus-js-client';
import { unexpectedError } from './unexpected-error';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { uploadFile } from '@/utils/upload-file';

export async function uploadFiles(
	files: globalThis.File[],
	options?: {
		onProgressChange?: (percentages: number[]) => void;
		onChunkedUpload?: (controllers: (Upload | null)[]) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		folder?: string;
	},
): Promise<(File | undefined)[]> {
	const progressHandler = options?.onProgressChange || (() => undefined);
	const progressForFiles = files.map(() => 0);
	const uploadControllers: (Upload | null)[] = Array(files.length).fill(null);

	try {
		const uploadedFiles = (
			await Promise.all(
				files.map((file, index) =>
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
					}),
				),
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
