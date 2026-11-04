import { router } from '@/router';

/** Opens the Flows list for a folder, or the root list when no folder is given. */
export function navigateToFolder(folder?: string | null) {
	if (folder) {
		return router.push({ name: 'flows-folder', params: { folder } });
	}

	return router.push({ name: 'flows-collection' });
}
