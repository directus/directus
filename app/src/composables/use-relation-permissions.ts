import { computed, Ref } from 'vue';
import {
	UsableCollectionPermissions,
	useCollectionPermissions,
} from './use-permissions/collection/use-collection-permissions';
import { RelationM2A } from './use-relation-m2a';
import { RelationM2M } from './use-relation-m2m';
import { RelationM2O } from './use-relation-m2o';
import { RelationO2M } from './use-relation-o2m';
import { normalizePermissions } from '@/components/v-form/utils/normalize-permissions';

export function useRelationPermissionsM2O(info: Ref<RelationM2O | undefined>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.relatedCollection.collection ?? null));

	return normalizePermissions({
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
		readAllowed: relatedPermissions.readAllowed,
	});
}

export function useRelationPermissionsO2M(info: Ref<RelationO2M | undefined>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.relatedCollection.collection ?? null));

	const deleteAllowed = computed(() => {
		if (info.value?.relation.meta?.one_deselect_action === 'delete') {
			return relatedPermissions.deleteAllowed.value;
		}

		return relatedPermissions.updateAllowed.value;
	});

	return normalizePermissions({
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
		deleteAllowed,
		readAllowed: relatedPermissions.readAllowed,
	});
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
		...normalizePermissions({
			createAllowed,
			updateAllowed,
			deleteAllowed,
		}),
		selectAllowed,
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

	const createAllowed = computed(() =>
		Object.values(relatedPermissions.value).every(
			(value) => value.createAllowed.value && junctionPermissions.createAllowed.value,
		),
	);

	const selectAllowed = computed(() => junctionPermissions.createAllowed.value);

	const updateAllowed = computed(() =>
		Object.values(relatedPermissions.value).every(
			(value) => value.updateAllowed.value && junctionPermissions.updateAllowed.value,
		),
	);

	const deleteAllowed = computed(() => {
		if (info.value?.junction.meta?.one_deselect_action === 'delete') {
			return Object.values(relatedPermissions.value).every(() => junctionPermissions.deleteAllowed.value);
		}

		return Object.values(relatedPermissions.value).every(
			(value) => value.updateAllowed.value && junctionPermissions.updateAllowed.value,
		);
	});

	return {
		...normalizePermissions({
			createAllowed,
			deleteAllowed,
			updateAllowed,
		}),
		selectAllowed,
	};
}

export function useRelationPermissionsTree(info: Ref<any>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.collection ?? null));

	return normalizePermissions({
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
		deleteAllowed: relatedPermissions.deleteAllowed,
	});
}

export function useRelationPermissionsFiles() {
	return normalizePermissions(useCollectionPermissions('directus_files'));
}

export function useRelationPermissionsTranslations(info: Ref<any>) {
	const relatedPermissions = useCollectionPermissions(computed(() => info.value?.collection ?? null));

	return normalizePermissions({
		createAllowed: relatedPermissions.createAllowed,
		updateAllowed: relatedPermissions.updateAllowed,
		deleteAllowed: relatedPermissions.deleteAllowed,
	});
}
