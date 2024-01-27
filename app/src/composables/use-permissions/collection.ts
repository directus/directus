import { Ref } from 'vue';
import { isCreateAllowed } from './lib/is-create-allowed';
import { isRevisionsAllowed } from './lib/is-revisions-allowed';
import { Collection } from './types';

export type UsableCollectionPermissions = {
	createAllowed: Ref<boolean>;
	revisionsAllowed: Ref<boolean>;
};

export function useCollectionPermissions(collection: Collection): UsableCollectionPermissions {
	const createAllowed = isCreateAllowed(collection);
	const revisionsAllowed = isRevisionsAllowed();

	return {
		createAllowed,
		revisionsAllowed,
	};
}
