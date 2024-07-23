import { Field } from '@directus/types';
import { ComputedRef, Ref } from 'vue';
import { isArchiveAllowed } from '../lib/is-archive-allowed';
import { Collection, IsNew, PrimaryKey } from '../types';
import { getFields } from './lib/get-fields';
import { isActionAllowed } from './lib/is-action-allowed';
import { fetchItemPermissions } from './utils/fetch-item-permissions';

export type UsableItemPermissions = {
	loading: Ref<boolean>;
	refresh: () => void;
	updateAllowed: ComputedRef<boolean>;
	deleteAllowed: ComputedRef<boolean>;
	shareAllowed: ComputedRef<boolean>;
	archiveAllowed: ComputedRef<boolean>;
	fields: ComputedRef<Field[]>;
};

/** Permissions on item level */
export function useItemPermissions(
	collection: Collection,
	primaryKey: PrimaryKey,
	isNew: IsNew,
): UsableItemPermissions {
	const { loading, fetchedItemPermissions, refresh } = fetchItemPermissions(collection, primaryKey);

	const updateAllowed = isActionAllowed(collection, isNew, fetchedItemPermissions, 'update');
	const deleteAllowed = isActionAllowed(collection, isNew, fetchedItemPermissions, 'delete');
	const shareAllowed = isActionAllowed(collection, isNew, fetchedItemPermissions, 'share');

	const archiveAllowed = isArchiveAllowed(collection, updateAllowed);

	const fields = getFields(collection, isNew, fetchedItemPermissions);

	return { loading, refresh, updateAllowed, deleteAllowed, shareAllowed, archiveAllowed, fields };
}
