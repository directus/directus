import uploadFile from '@/utils/upload-file';
import i18n from '@/lang';
import { useNotificationsStore } from '@/stores';

export default async function uploadFiles(
	files: File[],
	options?: {
		onProgressChange?: (percentages: number[]) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
	}
) {
	const notificationsStore = useNotificationsStore();
	const progressHandler = options?.onProgressChange || (() => undefined);
	const progressForFiles = files.map(() => 0);

	try {
		const uploadedFiles = await Promise.all(
			files.map((file, index) =>
				uploadFile(file, {
					...options,
					onProgressChange: (percentage: number) => {
						progressForFiles[index] = percentage;
						progressHandler(progressForFiles);
					},
				})
			)
		);

		if (options?.notifications) {
			notificationsStore.add({
				title: i18n.t('upload_files_success', { count: files.length }),
				type: 'success',
			});
		}

		return uploadedFiles;
	} catch (error) {
		throw error;
	}
}
