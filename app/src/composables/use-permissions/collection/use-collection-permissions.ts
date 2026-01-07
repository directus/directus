import { ComputedRef } from 'vue';
import { isArchiveAllowed } from '../lib/is-archive-allowed';
import { Collection } from '../types';
import { isActionAllowed } from './lib/is-action-allowed';
import { isRevisionsAllowed } from './lib/is-revisions-allowed';
import { isSortAllowed } from './lib/is-sort-allowed';

export type UsableCollectionPermissions = {
	readAllowed: ComputedRef<boolean>;
	createAllowed: ComputedRef<boolean>;
	updateAllowed: ComputedRef<boolean>;
	deleteAllowed: ComputedRef<boolean>;
	sortAllowed: ComputedRef<boolean>;
	archiveAllowed: ComputedRef<boolean>;
	revisionsAllowed: ComputedRef<boolean>;
};

/** Permissions on collection level */
export function useCollectionPermissions(collection: Collection): UsableCollectionPermissions {
	const readAllowed = isActionAllowed(collection, 'read');
	const createAllowed = isActionAllowed(collection, 'create');
	const updateAllowed = isActionAllowed(collection, 'update');
	const deleteAllowed = isActionAllowed(collection, 'delete');

	const sortAllowed = isSortAllowed(collection);
	const archiveAllowed = isArchiveAllowed(collection, updateAllowed);
	const revisionsAllowed = isRevisionsAllowed();

	return {
		readAllowed,
		createAllowed,
		updateAllowed,
		deleteAllowed,
		sortAllowed,
		archiveAllowed,
		revisionsAllowed,
	};
}
