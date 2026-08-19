import { ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export interface UseMoveToFolderOptions {
	onSuccess: () => void | Promise<void>;
}

export function useMoveToFolder({ onSuccess }: UseMoveToFolderOptions) {
	const moving = ref(false);

	return { moving, move };

	/**
	 * Moves the given flows into a folder. Pass `null` as the folder to move them back to root level.
	 */
	async function move(keys: string[], folder: string | null) {
		if (keys.length === 0 || moving.value) return;

		moving.value = true;

		try {
			await api.patch('/flows', { keys, data: { folder } });
			await onSuccess();
		} catch (error) {
			unexpectedError(error);
		} finally {
			moving.value = false;
		}
	}
}
