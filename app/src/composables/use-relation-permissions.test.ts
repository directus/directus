import { afterEach, expect, test, vi } from 'vitest';
import { ref, unref } from 'vue';
import {
	UsableCollectionPermissions,
	useCollectionPermissions,
} from './use-permissions/collection/use-collection-permissions';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2O } from './use-relation-m2o';
import { RelationO2M } from './use-relation-o2m';
import {
	useRelationPermissionsM2A,
	useRelationPermissionsM2M,
	useRelationPermissionsM2O,
	useRelationPermissionsO2M,
} from '@/composables/use-relation-permissions';

vi.mock('./use-permissions/collection/use-collection-permissions');

afterEach(() => {
	vi.clearAllMocks();
});

test('useRelationPermissionsM2O', () => {
	const relationM2O = {
		relatedCollection: {
			collection: 'b',
		},
		type: 'm2o',
	} as RelationM2O;

	const related = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
	};

	vi.mocked(useCollectionPermissions).mockReturnValue(related as UsableCollectionPermissions);

	const permissions = useRelationPermissionsM2O(ref(relationM2O));

	expect(unref(vi.mocked(useCollectionPermissions).mock.lastCall?.[0])).toEqual(
		relationM2O.relatedCollection.collection,
	);

	expect(permissions.createAllowed.value).toBe(false);
	related.createAllowed.value = true;
	expect(permissions.createAllowed.value).toBe(true);

	expect(permissions.updateAllowed.value).toBe(false);
	related.updateAllowed.value = true;
	expect(permissions.updateAllowed.value).toBe(true);
});

test('useRelationPermissionsO2M', () => {
	const relationO2M = ref({
		relation: {
			meta: {
				one_deselect_action: 'nullify',
			},
		},
		relatedCollection: {
			collection: 'b',
		},
		type: 'o2m',
	} as RelationO2M);

	const related = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
		deleteAllowed: ref(false),
	};

	vi.mocked(useCollectionPermissions).mockReturnValue(related as UsableCollectionPermissions);

	const permissions = useRelationPermissionsO2M(relationO2M);

	expect(unref(vi.mocked(useCollectionPermissions).mock.lastCall?.[0])).toEqual(
		relationO2M.value.relatedCollection.collection,
	);

	expect(permissions.createAllowed.value).toBe(false);
	related.createAllowed.value = true;
	expect(permissions.createAllowed.value).toBe(true);

	expect(permissions.updateAllowed.value).toBe(false);
	// corresponds to update value
	expect(permissions.deleteAllowed.value).toBe(false);
	related.updateAllowed.value = true;
	expect(permissions.updateAllowed.value).toBe(true);
	expect(permissions.deleteAllowed.value).toBe(true);

	relationO2M.value.relation.meta!.one_deselect_action = 'delete';
	// now corresponds to delete value
	expect(permissions.deleteAllowed.value).toBe(false);
	related.deleteAllowed.value = true;
	expect(permissions.deleteAllowed.value).toBe(true);
});

test('useRelationPermissionsM2M', () => {
	const relationM2M = ref({
		junctionCollection: {
			collection: 'a_b',
		},
		relatedCollection: {
			collection: 'b',
		},
		junction: {
			meta: {
				one_deselect_action: 'nullify',
			},
		},
	} as RelationM2M);

	const related = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
		deleteAllowed: ref(false),
	};

	const junction = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
		deleteAllowed: ref(false),
	};

	vi.mocked(useCollectionPermissions).mockImplementation(
		(collection) => (unref(collection) === 'a_b' ? junction : related) as UsableCollectionPermissions,
	);

	const permissions = useRelationPermissionsM2M(relationM2M);

	expect(permissions.createAllowed.value).toBe(false);
	expect(permissions.selectAllowed.value).toBe(false);
	related.createAllowed.value = true;
	expect(permissions.createAllowed.value).toBe(false);
	expect(permissions.selectAllowed.value).toBe(false);
	related.createAllowed.value = false;
	junction.createAllowed.value = true;
	expect(permissions.createAllowed.value).toBe(false);
	expect(permissions.selectAllowed.value).toBe(true);
	related.createAllowed.value = true;
	expect(permissions.createAllowed.value).toBe(true);
	expect(permissions.selectAllowed.value).toBe(true);

	expect(permissions.updateAllowed.value).toBe(false);
	// deleteAllowed corresponds to junction updateAllowed value
	expect(permissions.deleteAllowed.value).toBe(false);
	related.updateAllowed.value = true;
	expect(permissions.updateAllowed.value).toBe(false);
	expect(permissions.deleteAllowed.value).toBe(false);
	related.updateAllowed.value = false;
	junction.updateAllowed.value = true;
	expect(permissions.updateAllowed.value).toBe(false);
	expect(permissions.deleteAllowed.value).toBe(true);
	related.updateAllowed.value = true;
	expect(permissions.updateAllowed.value).toBe(true);
	expect(permissions.deleteAllowed.value).toBe(true);

	relationM2M.value.junction.meta!.one_deselect_action = 'delete';
	// deleteAllowed now corresponds to junction deleteAllowed value
	expect(permissions.deleteAllowed.value).toBe(false);
	junction.deleteAllowed.value = true;
	expect(permissions.deleteAllowed.value).toBe(true);
});

test('useRelationPermissionsM2A', () => {
	const relationM2A = ref({
		junctionCollection: {
			collection: 'a_b',
		},
		allowedCollections: [{ collection: 'a' }],
		junction: {
			meta: {
				one_deselect_action: 'nullify',
			},
		},
	} as RelationM2A);

	const junction = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
		deleteAllowed: ref(false),
	};

	const a = {
		createAllowed: ref(false),
		updateAllowed: ref(false),
		deleteAllowed: ref(false),
	};

	vi.mocked(useCollectionPermissions).mockImplementation(
		(collection) => (unref(collection) === 'a_b' ? junction : a) as UsableCollectionPermissions,
	);

	const permissions = useRelationPermissionsM2A(relationM2A);

	expect(permissions.createAllowed.value.a).toBe(false);
	expect(permissions.selectAllowed.value).toBe(false);
	a.createAllowed.value = true;
	expect(permissions.createAllowed.value.a).toBe(false);
	expect(permissions.selectAllowed.value).toBe(false);
	a.createAllowed.value = false;
	junction.createAllowed.value = true;
	expect(permissions.createAllowed.value.a).toBe(false);
	expect(permissions.selectAllowed.value).toBe(true);
	a.createAllowed.value = true;
	expect(permissions.createAllowed.value.a).toBe(true);
	expect(permissions.selectAllowed.value).toBe(true);

	expect(permissions.updateAllowed.value.a).toBe(false);
	// deleteAllowed corresponds to collection + junction updateAllowed value
	expect(permissions.deleteAllowed.value.a).toBe(false);
	a.updateAllowed.value = true;
	expect(permissions.updateAllowed.value.a).toBe(false);
	expect(permissions.deleteAllowed.value.a).toBe(false);
	a.updateAllowed.value = false;
	junction.updateAllowed.value = true;
	expect(permissions.updateAllowed.value.a).toBe(false);
	expect(permissions.deleteAllowed.value.a).toBe(false);
	a.updateAllowed.value = true;
	expect(permissions.updateAllowed.value.a).toBe(true);
	expect(permissions.deleteAllowed.value.a).toBe(true);

	relationM2A.value.junction.meta!.one_deselect_action = 'delete';
	// deleteAllowed now corresponds to junction deleteAllowed value
	expect(permissions.deleteAllowed.value.a).toBe(false);
	junction.deleteAllowed.value = true;
	expect(permissions.deleteAllowed.value.a).toBe(true);
});
