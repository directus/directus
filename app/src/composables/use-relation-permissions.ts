import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { PermissionsAction } from '@directus/shared/types';
import { computed, Ref } from 'vue';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2O } from './use-relation-m2o';
import { RelationO2M } from './use-relation-o2m';

type Permissions = Record<PermissionsAction, boolean>;

function useRelationPermissions(relationInfo: Ref<RelationM2A | undefined>): {
	relatedPerms: Ref<Record<string, Permissions> | undefined>;
	junctionPerms: Ref<Permissions | undefined>;
};
function useRelationPermissions(relationInfo: Ref<RelationM2O | RelationO2M | undefined>): {
	relatedPerms: Ref<Permissions | undefined>;
};
function useRelationPermissions(relationInfo: Ref<RelationM2M | undefined>): {
	relatedPerms: Ref<Permissions | undefined>;
	junctionPerms: Ref<Permissions | undefined>;
	createAllowed: Ref<boolean>;
	selectAllowed: Ref<boolean>;
	updateAllowed: Ref<boolean>;
	deleteAllowed: Ref<boolean>;
};
function useRelationPermissions(
	relationInfo: Ref<RelationM2O | RelationM2A | RelationM2M | RelationO2M | undefined>
): Record<string, any> {
	const info = relationInfo.value;
	const permissionsStore = usePermissionsStore();
	const userStore = useUserStore();
	const isAdmin = userStore.currentUser?.role?.admin_access;
	const role = userStore.currentUser?.role?.id;

	if (info?.type === 'o2m' || info?.type === 'm2o') {
		return {
			relatedPerms: computed(() => getPermsForCollection(info.relatedCollection.collection)),
		};
	} else if (info?.type === 'm2m') {
		const relatedPerms = computed(() => getPermsForCollection(info.relatedCollection.collection));
		const junctionPerms = computed(() => getPermsForCollection(info.junctionCollection.collection));

		const createAllowed = computed(
			() => (junctionPerms.value?.create ?? false) && (relatedPerms.value?.create ?? false)
		);
		const selectAllowed = computed(() => junctionPerms.value?.create ?? false);
		const updateAllowed = computed(
			() => (junctionPerms.value?.update ?? false) && (relatedPerms.value?.update ?? false)
		);
		const deleteAllowed = computed(() => {
			if (info.junction.meta?.one_deselect_action === 'delete') {
				return junctionPerms.value?.delete ?? false;
			}
			return junctionPerms.value?.update ?? false;
		});

		return {
			createAllowed,
			selectAllowed,
			updateAllowed,
			deleteAllowed,
			relatedPerms,
			junctionPerms,
		};
	} else if (info?.type === 'm2a') {
		return {
			relatedPerms: computed(() => {
				const perms: Record<string, Permissions> = {};

				for (const collection of info.allowedCollections) {
					perms[collection.collection] = getPermsForCollection(collection.collection);
				}
				return perms;
			}),
			junctionPerms: computed(() => getPermsForCollection(info.junctionCollection.collection)),
		};
	}

	return {
		relatedPerms: computed(() => undefined),
		junctionPerms: computed(() => undefined),
	};

	function getPermsForCollection(collection: string) {
		if (isAdmin) return getFullPerms(true);

		const permissions = getFullPerms(false);

		for (const permission of permissionsStore.permissions) {
			if (permission.collection !== collection || permission.role !== role) continue;

			permissions[permission.action] = true;
		}

		return permissions;
	}
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

export { useRelationPermissions };
