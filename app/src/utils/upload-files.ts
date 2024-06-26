import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { uploadFile } from '@/utils/upload-file';
import { unexpectedError } from './unexpected-error';
import * as tus from 'tus-js-client';

export async function uploadFiles(
	files: File[],
	options?: {
		onProgressChange?: (percentages: number[]) => void;
		onChunkedUpload?: (idk: tus.Upload) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		folder?: string;
	},
): Promise<File[] | undefined> {
	const progressHandler = options?.onProgressChange || (() => undefined);
	const progressForFiles = files.map(() => 0);

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
						onChunkedUpload: options?.onChunkedUpload
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

	return;
}
