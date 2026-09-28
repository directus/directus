import { ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export interface UseMoveToFolderOptions {
	/** The collection whose items are being moved (e.g. `files`, `flows`). */
	collection: string;
	/** The field on the collection that points at the folder. Defaults to `folder`. */
	field?: string;
	/** Called after a successful move, with the target folder (`null` for root). */
	onSuccess?: (folder: string | null) => void | Promise<void>;
}

/**
 * Moves items of a folder-organized collection into a folder.
 */
export function useMoveToFolder({ collection, field = 'folder', onSuccess }: UseMoveToFolderOptions) {
	const moving = ref(false);

	return { moving, move };

	/**
	 * Moves the given items into a folder. Pass `null` as the folder to move them back to root level.
	 */
	async function move(keys: string[], folder: string | null) {
		if (keys.length === 0 || moving.value) return;

		moving.value = true;

		try {
			await api.patch(`/${collection}`, { keys, data: { [field]: folder } });
			await onSuccess?.(folder);
		} catch (error) {
			unexpectedError(error);
		} finally {
			moving.value = false;
		}
	}
}
