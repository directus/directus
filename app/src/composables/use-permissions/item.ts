import { Ref } from 'vue';
import { fetchItemPermissions } from './lib/fetch-item-permissions';
import { isArchiveAllowed } from './lib/is-archive-allowed';
import { isItemActionAllowed } from './lib/is-item-action-allowed';

import { Collection, PrimaryKey } from './types';

export type UsableItemPermissions = {
	loading: Ref<boolean>;
	updateAllowed: Ref<boolean>;
	deleteAllowed: Ref<boolean>;
	shareAllowed: Ref<boolean>;
	archiveAllowed: Ref<boolean>;
};

export function useItemPermissions(collection: Collection, primaryKey: PrimaryKey): UsableItemPermissions {
	const { loading, fetchedItemPermissions } = fetchItemPermissions(collection, primaryKey);

	const updateAllowed = isItemActionAllowed(collection, 'update', fetchedItemPermissions);
	const deleteAllowed = isItemActionAllowed(collection, 'delete', fetchedItemPermissions);
	const shareAllowed = isItemActionAllowed(collection, 'share', fetchedItemPermissions);

	const archiveAllowed = isArchiveAllowed(collection, updateAllowed);

	return { loading, updateAllowed, deleteAllowed, shareAllowed, archiveAllowed };
}
