import {
	UsableCollectionPermissions,
	useCollectionPermissions,
} from './use-permissions/collection/use-collection-permissions';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2O } from './use-relation-m2o';
import { RelationO2M } from './use-relation-o2m';
import { computed, Ref } from 'vue';

export function useRelationPermissionsM2O(info: Ref<RelationM2O | undefined>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.relatedCollection.collection ?? null));

	return {
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
	};
}

export function useRelationPermissionsO2M(info: Ref<RelationO2M | undefined>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.relatedCollection.collection ?? null));

	const deleteAllowed = computed(() => {
		if (info.value?.relation.meta?.one_deselect_action === 'delete') {
			return relatedPermissions.deleteAllowed.value;
		}

		return relatedPermissions.updateAllowed.value;
	});

	return {
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
		deleteAllowed,
	};
}

export function useRelationPermissionsM2M(info: Ref<RelationM2M | undefined>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.relatedCollection.collection ?? null));

	const junctionPermissions = useCollectionPermissions(
		computed(() => info.value?.junctionCollection.collection ?? null),
	);

	const createAllowed = computed(
		() => junctionPermissions.createAllowed.value && relatedPermissions.createAllowed.value,
	);

	const selectAllowed = computed(() => junctionPermissions.createAllowed.value);

	const updateAllowed = computed(
		() => junctionPermissions.updateAllowed.value && relatedPermissions.updateAllowed.value,
	);

	const deleteAllowed = computed(() => {
		if (info.value?.junction.meta?.one_deselect_action === 'delete') {
			return junctionPermissions.deleteAllowed.value;
		}

		return junctionPermissions.updateAllowed.value;
	});

	return {
		createAllowed,
		selectAllowed,
		updateAllowed,
		deleteAllowed,
	};
}

export function useRelationPermissionsM2A(info: Ref<RelationM2A | undefined>) {
	const relatedPermissions = computed(() => {
		const permissions: Record<string, UsableCollectionPermissions> = {};

		for (const collection of info.value?.allowedCollections ?? []) {
			permissions[collection.collection] = useCollectionPermissions(collection.collection);
		}

		return permissions;
	});

	const junctionPermissions = useCollectionPermissions(
		computed(() => info.value?.junctionCollection.collection ?? null),
	);

	const createAllowed = computed(() => {
		return Object.fromEntries(
			Object.entries(relatedPermissions.value).map(([key, value]) => [
				key,
				value.createAllowed.value && junctionPermissions.createAllowed.value,
			]),
		);
	});

	const selectAllowed = computed(() => junctionPermissions.createAllowed.value);

	const updateAllowed = computed(() => {
		return Object.fromEntries(
			Object.entries(relatedPermissions.value).map(([key, value]) => [
				key,
				value.updateAllowed.value && junctionPermissions.updateAllowed.value,
			]),
		);
	});

	const deleteAllowed = computed(() => {
		if (info.value?.junction.meta?.one_deselect_action === 'delete') {
			return Object.fromEntries(
				Object.entries(relatedPermissions.value).map(([key]) => [key, junctionPermissions.deleteAllowed.value]),
			);
		}

		return Object.fromEntries(
			Object.entries(relatedPermissions.value).map(([key, value]) => [
				key,
				value.updateAllowed.value && junctionPermissions.updateAllowed.value,
			]),
		);
	});

	return {
		createAllowed,
		selectAllowed,
		deleteAllowed,
		updateAllowed,
	};
}
