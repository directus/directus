import { ComputedRef } from 'vue';
import { UsableCollectionPermissions, useCollectionPermissions } from './collection/use-collection-permissions';
import { UsableItemPermissions, useItemPermissions } from './item/use-item-permissions';
import { isSaveAllowed } from './lib/is-save-allowed';
import { Collection, IsNew, PrimaryKey } from './types';

export type UsablePermissions = {
	collectionPermissions: UsableCollectionPermissions;
	itemPermissions: UsableItemPermissions & { saveAllowed: ComputedRef<boolean> };
};

export function usePermissions(collection: Collection, primaryKey: PrimaryKey, isNew: IsNew, isVersion: IsNew = false): UsablePermissions {
	const collectionPermissions = useCollectionPermissions(collection);

	const itemPermissions = useItemPermissions(collection, primaryKey, isNew, isVersion);

	const saveAllowed = isSaveAllowed(isNew, collectionPermissions.createAllowed, itemPermissions.updateAllowed);

	return {
		collectionPermissions,
		itemPermissions: { ...itemPermissions, saveAllowed },
	};
}

export { useCollectionPermissions, useItemPermissions };
