import { UsableCollectionPermissions, useCollectionPermissions } from './collection/use-collection-permissions';
import { UsableItemPermissions, useItemPermissions } from './item/use-item-permissions';
import { isSaveAllowed } from './lib/is-save-allowed';
import { Collection, IsNew, PrimaryKey } from './types';
import { ComputedRef } from 'vue';

export type UsablePermissions = {
	collectionPermissions: UsableCollectionPermissions;
	itemPermissions: UsableItemPermissions & { saveAllowed: ComputedRef<boolean> };
};

export function usePermissions(collection: Collection, primaryKey: PrimaryKey, isNew: IsNew): UsablePermissions {
	const collectionPermissions = useCollectionPermissions(collection);

	const itemPermissions = useItemPermissions(collection, primaryKey, isNew);

	const saveAllowed = isSaveAllowed(isNew, collectionPermissions.createAllowed, itemPermissions.updateAllowed);

	return {
		collectionPermissions,
		itemPermissions: { ...itemPermissions, saveAllowed },
	};
}

export { useCollectionPermissions, useItemPermissions };
