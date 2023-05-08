import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { PermissionsAction } from '@directus/types';
import { computed, Ref } from 'vue';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2O } from './use-relation-m2o';
import { RelationO2M } from './use-relation-o2m';

type Permissions = Record<PermissionsAction, boolean>;

export function useRelationPermissionsM2O(info: Ref<RelationM2O | undefined>) {
	const relatedPerms = computed(() => getPermsForCollection(info.value?.relatedCollection.collection));
	const createAllowed = computed(() => relatedPerms.value?.create);
	const updateAllowed = computed(() => relatedPerms.value?.update);

	return {
		relatedPerms,
		createAllowed,
		updateAllowed,
	};
}

export function useRelationPermissionsO2M(info: Ref<RelationO2M | undefined>) {
	const relatedPerms = computed(() => getPermsForCollection(info.value?.relatedCollection.collection));
	const createAllowed = computed(() => relatedPerms.value?.create);
	const updateAllowed = computed(() => relatedPerms.value?.update);

	const deleteAllowed = computed(() => {
		if (info.value?.relation.meta?.one_deselect_action === 'delete') {
			return relatedPerms.value?.delete;
		}

		return relatedPerms.value?.update;
	});

	return {
		relatedPerms,
		createAllowed,
		updateAllowed,
		deleteAllowed,
	};
}

export function useRelationPermissionsM2M(info: Ref<RelationM2M | undefined>) {
	const relatedPerms = computed(() => getPermsForCollection(info.value?.relatedCollection.collection));
	const junctionPerms = computed(() => getPermsForCollection(info.value?.junctionCollection.collection));

	const createAllowed = computed(() => junctionPerms.value.create && relatedPerms.value.create);
	const selectAllowed = computed(() => junctionPerms.value.create);
	const updateAllowed = computed(() => junctionPerms.value.update && relatedPerms.value.update);

	const deleteAllowed = computed(() => {
		if (info.value?.junction.meta?.one_deselect_action === 'delete') {
			return junctionPerms.value.delete;
		}

		return junctionPerms.value.update;
	});

	return {
		createAllowed,
		selectAllowed,
		updateAllowed,
		deleteAllowed,
		relatedPerms,
		junctionPerms,
	};
}

export function useRelationPermissionsM2A(info: Ref<RelationM2A | undefined>) {
	const relatedPerms = computed(() => {
		const perms: Record<string, Permissions> = {};

		for (const collection of info.value?.allowedCollections ?? []) {
			perms[collection.collection] = getPermsForCollection(collection.collection);
		}

		return perms;
	});

	const junctionPerms = computed(() => getPermsForCollection(info.value?.junctionCollection.collection));

	const createAllowed = computed(() => {
		return Object.fromEntries(
			Object.entries(relatedPerms.value).map(([key, value]) => [key, value.create && junctionPerms.value.create])
		);
	});

	const selectAllowed = computed(() => junctionPerms.value.create);

	const updateAllowed = computed(() => {
		return Object.fromEntries(
			Object.entries(relatedPerms.value).map(([key, value]) => [key, value.update && junctionPerms.value.update])
		);
	});

	const deleteAllowed = computed(() => {
		if (info.value?.junction.meta?.one_deselect_action === 'delete') {
			return Object.fromEntries(
				Object.entries(relatedPerms.value).map(([key, value]) => [key, value.delete && junctionPerms.value.delete])
			);
		}

		return Object.fromEntries(
			Object.entries(relatedPerms.value).map(([key, value]) => [key, value.update && junctionPerms.value.update])
		);
	});

	return {
		createAllowed,
		selectAllowed,
		relatedPerms,
		junctionPerms,
		deleteAllowed,
		updateAllowed,
	};
}

function getPermsForCollection(collection: string | undefined) {
	const userStore = useUserStore();
	const isAdmin = userStore.currentUser?.role?.admin_access;

	if (isAdmin) return getFullPerms(true);

	const role = userStore.currentUser?.role?.id;
	const permissions = getFullPerms(false);
	const permissionsStore = usePermissionsStore();

	if (collection === undefined) return permissions;

	for (const permission of permissionsStore.permissions) {
		if (permission.collection !== collection || permission.role !== role) continue;

		permissions[permission.action] = true;
	}

	return permissions;
}

function getFullPerms(bool: boolean): Permissions {
	return {
		read: bool,
		create: bool,
		update: bool,
		delete: bool,
		comment: bool,
		explain: bool,
		share: bool,
	};
}
