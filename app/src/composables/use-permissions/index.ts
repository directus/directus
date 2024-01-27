import { Ref } from 'vue';
import { UsableCollectionPermissions, useCollectionPermissions } from './collection';
import { UsableFieldsPermissions, useFieldsPermissions } from './fields';
import { UsableItemPermissions, useItemPermissions } from './item';
import { isSaveAllowed } from './lib/is-save-allowed';
import { Collection, IsNew, PrimaryKey } from './types';

type UsablePermissions = UsableItemPermissions &
	UsableFieldsPermissions &
	UsableCollectionPermissions & {
		saveAllowed: Ref<boolean>;
	};

export function usePermissions(collection: Collection, primaryKey: PrimaryKey, isNew: IsNew): UsablePermissions {
	const { createAllowed, revisionsAllowed } = useCollectionPermissions(collection);

	const { fields } = useFieldsPermissions(collection, isNew);

	const { loading, updateAllowed, deleteAllowed, shareAllowed, archiveAllowed } = useItemPermissions(
		collection,
		primaryKey,
	);

	const saveAllowed = isSaveAllowed(isNew, createAllowed, updateAllowed);

	return {
		loading,
		createAllowed,
		deleteAllowed,
		saveAllowed,
		archiveAllowed,
		updateAllowed,
		shareAllowed,
		revisionsAllowed,
		fields,
	};
}
